import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Plus, Trash2, Package, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrafting } from "@/hooks/useCrafting";
import { supabase } from "@/integrations/supabase/client";

interface CraftingRecipeEditorProps {
  campaignId: string;
}

interface CampaignItem {
  id: string;
  name: string;
  icon_emoji: string | null;
  rarity: string;
}

export const CraftingRecipeEditor = ({ campaignId }: CraftingRecipeEditorProps) => {
  const { recipes, loading, createRecipe, deleteRecipe } = useCrafting(campaignId);
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resultItemId, setResultItemId] = useState("");
  const [resultQuantity, setResultQuantity] = useState(1);
  const [requiredStat, setRequiredStat] = useState("");
  const [requiredStatValue, setRequiredStatValue] = useState(0);
  const [ingredients, setIngredients] = useState<{ item_id: string; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("rp_items")
        .select("id, name, icon_emoji, rarity")
        .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
        .order("name");
      setItems((data || []).map(i => ({ ...i, icon_emoji: i.icon_emoji || "📦" })));
    };
    fetchItems();
  }, [campaignId]);

  const addIngredient = () => {
    setIngredients([...ingredients, { item_id: "", quantity: 1 }]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name || !resultItemId || ingredients.length === 0) return;
    setSaving(true);
    await createRecipe({
      name, description, result_item_id: resultItemId, result_quantity: resultQuantity,
      required_stat: requiredStat || undefined,
      required_stat_value: requiredStatValue || undefined,
      ingredients: ingredients.filter(i => i.item_id),
    });
    setShowForm(false);
    setName(""); setDescription(""); setResultItemId(""); setResultQuantity(1);
    setRequiredStat(""); setRequiredStatValue(0); setIngredients([]);
    setSaving(false);
  };

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || "Unknown";
  const getItemEmoji = (id: string) => items.find(i => i.id === id)?.icon_emoji || "📦";

  const rarityColor: Record<string, string> = {
    common: "text-muted-foreground",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-amber-400",
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading recipes...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Hammer className="h-5 w-5 text-amber-400" />
          Crafting Recipes
          <Badge variant="secondary" className="text-xs">{recipes.length}</Badge>
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
          <Plus className="h-4 w-4 mr-1" /> {showForm ? "Cancel" : "Add Recipe"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Recipe Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Iron Sword" />
                  </div>
                  <div>
                    <Label className="text-xs">Result Item</Label>
                    <Select value={resultItemId} onValueChange={setResultItemId}>
                      <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                      <SelectContent>
                        {items.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.icon_emoji} {i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="How to craft this item..." rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Result Qty</Label>
                    <Input type="number" min={1} value={resultQuantity} onChange={e => setResultQuantity(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Required Stat</Label>
                    <Select value={requiredStat} onValueChange={setRequiredStat}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {["strength", "magic", "charisma", "wisdom", "agility"].map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Min Value</Label>
                    <Input type="number" min={0} max={10} value={requiredStatValue} onChange={e => setRequiredStatValue(Number(e.target.value))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Ingredients</Label>
                    <Button size="sm" variant="ghost" onClick={addIngredient} className="text-xs h-6">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={ing.item_id} onValueChange={v => {
                        const updated = [...ingredients];
                        updated[idx].item_id = v;
                        setIngredients(updated);
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select item..." /></SelectTrigger>
                        <SelectContent>
                          {items.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.icon_emoji} {i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} className="w-16" value={ing.quantity} onChange={e => {
                        const updated = [...ingredients];
                        updated[idx].quantity = Number(e.target.value);
                        setIngredients(updated);
                      }} />
                      <Button size="sm" variant="ghost" onClick={() => removeIngredient(idx)} className="h-8 w-8 p-0">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} disabled={saving || !name || !resultItemId || ingredients.length === 0} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Hammer className="h-4 w-4 mr-1" />}
                  Create Recipe
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {recipes.map((recipe) => (
          <motion.div key={recipe.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50 hover:border-amber-500/30 transition-colors">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{recipe.name}</span>
                      {recipe.required_stat && (
                        <Badge variant="outline" className="text-[10px]">
                          {recipe.required_stat} ≥ {recipe.required_stat_value}
                        </Badge>
                      )}
                    </div>
                    {recipe.description && <p className="text-xs text-muted-foreground">{recipe.description}</p>}
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {recipe.ingredients.map(ing => (
                        <Badge key={ing.id} variant="secondary" className="text-[10px]">
                          {ing.item_emoji} {ing.item_name} x{ing.quantity}
                        </Badge>
                      ))}
                      <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                      <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {recipe.result_item_emoji} {recipe.result_item_name} x{recipe.result_quantity}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteRecipe(recipe.id)} className="h-7 w-7 p-0">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {recipes.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">No crafting recipes yet. Add one to let players craft items!</p>
        )}
      </div>
    </div>
  );
};
