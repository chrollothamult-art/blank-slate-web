import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface LootEntry {
  id: string;
  loot_table_id: string;
  item_id: string;
  quantity: number;
  drop_chance: number;
  min_level: number;
  conditions: Record<string, unknown>;
  item_name?: string;
  item_emoji?: string;
  item_rarity?: string;
}

export interface LootTable {
  id: string;
  campaign_id: string;
  node_id: string | null;
  name: string;
  description: string | null;
  max_drops: number;
  created_at: string;
  entries: LootEntry[];
}

export const useLootTables = (campaignId?: string) => {
  const { user } = useAuth();
  const [lootTables, setLootTables] = useState<LootTable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLootTables = useCallback(async () => {
    if (!campaignId) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("rp_loot_tables")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    if (error) { console.error("Error fetching loot tables:", error); setLoading(false); return; }

    const tableIds = (data || []).map(t => t.id);
    let entries: any[] = [];
    if (tableIds.length > 0) {
      const { data: e } = await supabase.from("rp_loot_table_entries").select("*").in("loot_table_id", tableIds);
      entries = e || [];
    }

    const itemIds = entries.map(e => e.item_id);
    let items: any[] = [];
    if (itemIds.length > 0) {
      const { data: i } = await supabase.from("rp_items").select("id, name, icon_emoji, rarity").in("id", itemIds);
      items = i || [];
    }
    const itemMap = new Map(items.map(i => [i.id, i]));

    setLootTables((data || []).map(t => ({
      ...t,
      entries: entries
        .filter(e => e.loot_table_id === t.id)
        .map(e => {
          const item = itemMap.get(e.item_id);
          return {
            ...e,
            drop_chance: Number(e.drop_chance),
            min_level: e.min_level || 0,
            conditions: (e.conditions as Record<string, unknown>) || {},
            item_name: item?.name || "Unknown",
            item_emoji: item?.icon_emoji || "📦",
            item_rarity: item?.rarity || "common",
          };
        }),
    })));
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetchLootTables(); }, [fetchLootTables]);

  const createLootTable = useCallback(async (table: {
    name: string; description?: string; node_id?: string; max_drops?: number;
    entries: { item_id: string; quantity: number; drop_chance: number; min_level?: number }[];
  }): Promise<boolean> => {
    if (!campaignId || !user) return false;

    const { data, error } = await supabase.from("rp_loot_tables").insert({
      campaign_id: campaignId,
      name: table.name,
      description: table.description || null,
      node_id: table.node_id || null,
      max_drops: table.max_drops || 1,
    }).select("id").single();

    if (error || !data) { toast({ title: "Failed to create loot table", variant: "destructive" }); return false; }

    if (table.entries.length > 0) {
      await supabase.from("rp_loot_table_entries").insert(
        table.entries.map(e => ({
          loot_table_id: data.id,
          item_id: e.item_id,
          quantity: e.quantity,
          drop_chance: e.drop_chance,
          min_level: e.min_level || 0,
        }))
      );
    }

    toast({ title: "🎲 Loot table created!" });
    await fetchLootTables();
    return true;
  }, [campaignId, user, fetchLootTables]);

  const deleteLootTable = useCallback(async (tableId: string): Promise<boolean> => {
    const { error } = await supabase.from("rp_loot_tables").delete().eq("id", tableId);
    if (error) { toast({ title: "Failed to delete loot table", variant: "destructive" }); return false; }
    toast({ title: "Loot table deleted" });
    await fetchLootTables();
    return true;
  }, [fetchLootTables]);

  const rollLoot = useCallback((tableId: string, characterLevel: number = 1): { item_id: string; quantity: number; item_name: string; item_emoji: string }[] => {
    const table = lootTables.find(t => t.id === tableId);
    if (!table) return [];

    const eligible = table.entries.filter(e => characterLevel >= e.min_level);
    const drops: typeof eligible = [];

    for (const entry of eligible) {
      if (drops.length >= table.max_drops) break;
      if (Math.random() * 100 <= entry.drop_chance) {
        drops.push(entry);
      }
    }

    return drops.map(d => ({
      item_id: d.item_id,
      quantity: d.quantity,
      item_name: d.item_name || "Unknown",
      item_emoji: d.item_emoji || "📦",
    }));
  }, [lootTables]);

  return { lootTables, loading, createLootTable, deleteLootTable, rollLoot, refetch: fetchLootTables };
};
