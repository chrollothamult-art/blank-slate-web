import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface RpItem {
  id: string;
  campaign_id: string | null;
  name: string;
  description: string | null;
  item_type: string;
  effect: Record<string, unknown>;
  rarity: string;
  icon_url: string | null;
  icon_emoji: string;
  is_consumable: boolean;
  is_quest_item: boolean;
  stat_bonus: Record<string, number> | null;
  created_at: string;
}

export interface InventoryEntry {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
  source_node_id: string | null;
  source_session_id: string | null;
  item?: RpItem;
}

export const useInventory = (characterId?: string) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("rp_character_inventory")
      .select("*")
      .eq("character_id", characterId)
      .order("acquired_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error);
      setLoading(false);
      return;
    }

    // Fetch item details
    const itemIds = (data || []).map((d) => d.item_id);
    if (itemIds.length === 0) {
      setInventory([]);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("rp_items")
      .select("*")
      .in("id", itemIds);

    const itemMap = new Map(
      (items || []).map((i) => [
        i.id,
        {
          ...i,
          effect: (i.effect as Record<string, unknown>) || {},
          stat_bonus: i.stat_bonus as Record<string, number> | null,
          icon_emoji: i.icon_emoji || "📦",
          is_consumable: i.is_consumable || false,
          is_quest_item: i.is_quest_item || false,
        } as RpItem,
      ])
    );

    setInventory(
      (data || []).map((entry) => ({
        ...entry,
        source_session_id: entry.source_session_id || null,
        item: itemMap.get(entry.item_id),
      }))
    );
    setLoading(false);
  }, [characterId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addItem = useCallback(
    async (
      itemId: string,
      quantity: number = 1,
      sourceNodeId?: string,
      sourceSessionId?: string
    ): Promise<boolean> => {
      if (!characterId || !user) return false;

      // Check if item already in inventory (upsert quantity)
      const existing = inventory.find((e) => e.item_id === itemId);

      if (existing) {
        const { error } = await supabase
          .from("rp_character_inventory")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);

        if (error) {
          console.error("Error updating inventory:", error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from("rp_character_inventory")
          .insert({
            character_id: characterId,
            item_id: itemId,
            quantity,
            source_node_id: sourceNodeId || null,
            source_session_id: sourceSessionId || null,
          });

        if (error) {
          console.error("Error adding to inventory:", error);
          return false;
        }
      }

      // Get item name for toast
      const { data: item } = await supabase
        .from("rp_items")
        .select("name, icon_emoji")
        .eq("id", itemId)
        .single();

      if (item) {
        toast({
          title: `${item.icon_emoji || "📦"} Item Acquired!`,
          description: `${item.name} x${quantity} added to inventory`,
        });
      }

      await fetchInventory();
      return true;
    },
    [characterId, user, inventory, fetchInventory]
  );

  const removeItem = useCallback(
    async (itemId: string, quantity: number = 1): Promise<boolean> => {
      if (!characterId || !user) return false;

      const existing = inventory.find((e) => e.item_id === itemId);
      if (!existing) return false;

      if (existing.quantity <= quantity) {
        const { error } = await supabase
          .from("rp_character_inventory")
          .delete()
          .eq("id", existing.id);

        if (error) {
          console.error("Error removing from inventory:", error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from("rp_character_inventory")
          .update({ quantity: existing.quantity - quantity })
          .eq("id", existing.id);

        if (error) {
          console.error("Error updating inventory:", error);
          return false;
        }
      }

      await fetchInventory();
      return true;
    },
    [characterId, user, inventory, fetchInventory]
  );

  const hasItem = useCallback(
    (itemId: string): boolean => {
      return inventory.some((e) => e.item_id === itemId && e.quantity > 0);
    },
    [inventory]
  );

  const getItemCount = useCallback(
    (itemId: string): number => {
      return inventory.find((e) => e.item_id === itemId)?.quantity || 0;
    },
    [inventory]
  );

  return {
    inventory,
    loading,
    addItem,
    removeItem,
    hasItem,
    getItemCount,
    refetch: fetchInventory,
  };
};
