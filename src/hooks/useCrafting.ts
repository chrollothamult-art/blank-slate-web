import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CraftingIngredient {
  id: string;
  recipe_id: string;
  item_id: string;
  quantity: number;
  item_name?: string;
  item_emoji?: string;
}

export interface CraftingRecipe {
  id: string;
  campaign_id: string | null;
  name: string;
  description: string | null;
  result_item_id: string;
  result_quantity: number;
  required_stat: string | null;
  required_stat_value: number | null;
  crafting_time_turns: number;
  created_at: string;
  result_item_name?: string;
  result_item_emoji?: string;
  ingredients: CraftingIngredient[];
}

export const useCrafting = (campaignId?: string) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    if (!campaignId) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("rp_crafting_recipes")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    if (error) { console.error("Error fetching recipes:", error); setLoading(false); return; }

    const recipeIds = (data || []).map(r => r.id);
    const resultItemIds = (data || []).map(r => r.result_item_id);

    // Fetch ingredients and items in parallel
    const [ingredientsRes, itemsRes] = await Promise.all([
      recipeIds.length > 0
        ? supabase.from("rp_crafting_ingredients").select("*").in("recipe_id", recipeIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      resultItemIds.length > 0
        ? supabase.from("rp_items").select("id, name, icon_emoji").in("id", resultItemIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    // Also fetch ingredient item names
    const ingredientItemIds = (ingredientsRes.data || []).map((i: any) => i.item_id);
    let ingredientItems: any[] = [];
    if (ingredientItemIds.length > 0) {
      const { data: ii } = await supabase.from("rp_items").select("id, name, icon_emoji").in("id", ingredientItemIds);
      ingredientItems = ii || [];
    }

    const itemMap = new Map([...(itemsRes.data || []), ...ingredientItems].map((i: any) => [i.id, i]));

    setRecipes((data || []).map(r => {
      const resultItem = itemMap.get(r.result_item_id);
      return {
        ...r,
        crafting_time_turns: r.crafting_time_turns || 0,
        result_item_name: resultItem?.name || "Unknown",
        result_item_emoji: resultItem?.icon_emoji || "📦",
        ingredients: (ingredientsRes.data || [])
          .filter((i: any) => i.recipe_id === r.id)
          .map((i: any) => {
            const item = itemMap.get(i.item_id);
            return { ...i, item_name: item?.name || "Unknown", item_emoji: item?.icon_emoji || "📦" };
          }),
      };
    }));
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const createRecipe = useCallback(async (recipe: {
    name: string; description?: string; result_item_id: string; result_quantity?: number;
    required_stat?: string; required_stat_value?: number; crafting_time_turns?: number;
    ingredients: { item_id: string; quantity: number }[];
  }): Promise<boolean> => {
    if (!campaignId || !user) return false;

    const { data, error } = await supabase.from("rp_crafting_recipes").insert({
      campaign_id: campaignId,
      name: recipe.name,
      description: recipe.description || null,
      result_item_id: recipe.result_item_id,
      result_quantity: recipe.result_quantity || 1,
      required_stat: recipe.required_stat || null,
      required_stat_value: recipe.required_stat_value || null,
      crafting_time_turns: recipe.crafting_time_turns || 0,
    }).select("id").single();

    if (error || !data) {
      toast({ title: "Failed to create recipe", variant: "destructive" });
      return false;
    }

    if (recipe.ingredients.length > 0) {
      const { error: ingError } = await supabase.from("rp_crafting_ingredients").insert(
        recipe.ingredients.map(i => ({ recipe_id: data.id, item_id: i.item_id, quantity: i.quantity }))
      );
      if (ingError) console.error("Error adding ingredients:", ingError);
    }

    toast({ title: "🔨 Recipe created!" });
    await fetchRecipes();
    return true;
  }, [campaignId, user, fetchRecipes]);

  const deleteRecipe = useCallback(async (recipeId: string): Promise<boolean> => {
    const { error } = await supabase.from("rp_crafting_recipes").delete().eq("id", recipeId);
    if (error) { toast({ title: "Failed to delete recipe", variant: "destructive" }); return false; }
    toast({ title: "Recipe deleted" });
    await fetchRecipes();
    return true;
  }, [fetchRecipes]);

  const craftItem = useCallback(async (
    recipeId: string, characterId: string, inventory: Array<{ item_id: string; quantity: number }>
  ): Promise<boolean> => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return false;

    // Check ingredients
    for (const ing of recipe.ingredients) {
      const has = inventory.find(i => i.item_id === ing.item_id);
      if (!has || has.quantity < ing.quantity) {
        toast({ title: "Missing ingredients", description: `Need ${ing.quantity}x ${ing.item_name}`, variant: "destructive" });
        return false;
      }
    }

    // Remove ingredients
    for (const ing of recipe.ingredients) {
      const { data: invEntry } = await supabase
        .from("rp_character_inventory")
        .select("id, quantity")
        .eq("character_id", characterId)
        .eq("item_id", ing.item_id)
        .single();

      if (invEntry) {
        if (invEntry.quantity <= ing.quantity) {
          await supabase.from("rp_character_inventory").delete().eq("id", invEntry.id);
        } else {
          await supabase.from("rp_character_inventory").update({ quantity: invEntry.quantity - ing.quantity }).eq("id", invEntry.id);
        }
      }
    }

    // Add result item
    const { data: existing } = await supabase
      .from("rp_character_inventory")
      .select("id, quantity")
      .eq("character_id", characterId)
      .eq("item_id", recipe.result_item_id)
      .single();

    if (existing) {
      await supabase.from("rp_character_inventory").update({ quantity: existing.quantity + recipe.result_quantity }).eq("id", existing.id);
    } else {
      await supabase.from("rp_character_inventory").insert({
        character_id: characterId,
        item_id: recipe.result_item_id,
        quantity: recipe.result_quantity,
      });
    }

    toast({ title: `🔨 Crafted ${recipe.result_item_emoji} ${recipe.result_item_name}!` });
    return true;
  }, [recipes]);

  return { recipes, loading, createRecipe, deleteRecipe, craftItem, refetch: fetchRecipes };
};
