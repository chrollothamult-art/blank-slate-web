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
  max_durability: number | null;
  equipment_slot: string | null;
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
  equipped_slot: string | null;
  current_durability: number | null;
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
          max_durability: i.max_durability || null,
          equipment_slot: i.equipment_slot || null,
        } as RpItem,
      ])
    );

    setInventory(
      (data || []).map((entry) => ({
        ...entry,
        source_session_id: entry.source_session_id || null,
        equipped_slot: entry.equipped_slot || null,
        current_durability: entry.current_durability || null,
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

  const equipItem = useCallback(
    async (inventoryEntryId: string, slot: string): Promise<boolean> => {
      if (!characterId || !user) return false;

      // Unequip any item currently in that slot
      const currentlyEquipped = inventory.find((e) => e.equipped_slot === slot);
      if (currentlyEquipped) {
        await supabase
          .from("rp_character_inventory")
          .update({ equipped_slot: null })
          .eq("id", currentlyEquipped.id);
      }

      const { error } = await supabase
        .from("rp_character_inventory")
        .update({ equipped_slot: slot })
        .eq("id", inventoryEntryId);

      if (error) {
        console.error("Error equipping item:", error);
        return false;
      }

      const entry = inventory.find((e) => e.id === inventoryEntryId);
      if (entry?.item) {
        toast({
          title: `${entry.item.icon_emoji} Equipped ${entry.item.name}`,
          description: `Placed in ${slot} slot`,
        });
      }

      await fetchInventory();
      return true;
    },
    [characterId, user, inventory, fetchInventory]
  );

  const unequipItem = useCallback(
    async (inventoryEntryId: string): Promise<boolean> => {
      if (!characterId || !user) return false;

      const { error } = await supabase
        .from("rp_character_inventory")
        .update({ equipped_slot: null })
        .eq("id", inventoryEntryId);

      if (error) {
        console.error("Error unequipping item:", error);
        return false;
      }

      await fetchInventory();
      return true;
    },
    [characterId, user, fetchInventory]
  );

  const degradeDurability = useCallback(
    async (inventoryEntryId: string, amount: number = 1): Promise<boolean> => {
      if (!characterId || !user) return false;

      const entry = inventory.find((e) => e.id === inventoryEntryId);
      if (!entry || entry.current_durability === null) return false;

      const newDurability = Math.max(0, entry.current_durability - amount);

      const { error } = await supabase
        .from("rp_character_inventory")
        .update({ current_durability: newDurability })
        .eq("id", inventoryEntryId);

      if (error) {
        console.error("Error degrading durability:", error);
        return false;
      }

      if (newDurability === 0 && entry.item) {
        toast({
          title: `${entry.item.icon_emoji} ${entry.item.name} broke!`,
          description: "This item needs repair.",
          variant: "destructive",
        });
      }

      await fetchInventory();
      return true;
    },
    [characterId, user, inventory, fetchInventory]
  );

  const getEquippedItems = useCallback((): InventoryEntry[] => {
    return inventory.filter((e) => e.equipped_slot !== null);
  }, [inventory]);

  const getEquippedStatBonuses = useCallback((): Record<string, number> => {
    const bonuses: Record<string, number> = {};
    for (const entry of inventory) {
      if (entry.equipped_slot && entry.item?.stat_bonus) {
        // Don't apply bonuses from broken items
        if (entry.current_durability !== null && entry.current_durability <= 0) continue;
        for (const [stat, value] of Object.entries(entry.item.stat_bonus)) {
          bonuses[stat] = (bonuses[stat] || 0) + value;
        }
      }
    }
    return bonuses;
  }, [inventory]);

  return {
    inventory,
    loading,
    addItem,
    removeItem,
    hasItem,
    getItemCount,
    equipItem,
    unequipItem,
    degradeDurability,
    getEquippedItems,
    getEquippedStatBonuses,
    refetch: fetchInventory,
  };
};
