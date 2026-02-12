import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice6, Plus, Trash2, Loader2, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLootTables } from "@/hooks/useLootTables";
import { supabase } from "@/integrations/supabase/client";

interface LootTableEditorProps {
  campaignId: string;
}

interface CampaignItem {
  id: string;
  name: string;
  icon_emoji: string | null;
  rarity: string;
}

export const LootTableEditor = ({ campaignId }: LootTableEditorProps) => {
  const { lootTables, loading, createLootTable, deleteLootTable } = useLootTables(campaignId);
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxDrops, setMaxDrops] = useState(1);
  const [entries, setEntries] = useState<{ item_id: string; quantity: number; drop_chance: number; min_level: number }[]>([]);
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

  const addEntry = () => {
    setEntries([...entries, { item_id: "", quantity: 1, drop_chance: 50, min_level: 0 }]);
  };

  const removeEntry = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name || entries.length === 0) return;
    setSaving(true);
    await createLootTable({
      name, description, max_drops: maxDrops,
      entries: entries.filter(e => e.item_id),
    });
    setShowForm(false);
    setName(""); setDescription(""); setMaxDrops(1); setEntries([]);
    setSaving(false);
  };

  const rarityColor: Record<string, string> = {
    common: "border-muted-foreground/30",
    uncommon: "border-green-500/30",
    rare: "border-blue-500/30",
    epic: "border-purple-500/30",
    legendary: "border-amber-500/30",
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading loot tables...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Dice6 className="h-5 w-5 text-emerald-400" />
          Loot Tables
          <Badge variant="secondary" className="text-xs">{lootTables.length}</Badge>
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
          <Plus className="h-4 w-4 mr-1" /> {showForm ? "Cancel" : "Add Loot Table"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Table Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Forest Treasure" />
                  </div>
                  <div>
                    <Label className="text-xs">Max Drops</Label>
                    <Input type="number" min={1} max={10} value={maxDrops} onChange={e => setMaxDrops(Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Items found in forest encounters..." rows={2} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Loot Entries</Label>
                    <Button size="sm" variant="ghost" onClick={addEntry} className="text-xs h-6">
                      <Plus className="h-3 w-3 mr-1" /> Add Entry
                    </Button>
                  </div>
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={entry.item_id} onValueChange={v => {
                        const updated = [...entries];
                        updated[idx].item_id = v;
                        setEntries(updated);
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Item..." /></SelectTrigger>
                        <SelectContent>
                          {items.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.icon_emoji} {i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={1} className="w-14" value={entry.quantity} onChange={e => {
                          const updated = [...entries];
                          updated[idx].quantity = Number(e.target.value);
                          setEntries(updated);
                        }} />
                        <span className="text-xs text-muted-foreground">qty</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={1} max={100} className="w-16" value={entry.drop_chance} onChange={e => {
                          const updated = [...entries];
                          updated[idx].drop_chance = Number(e.target.value);
                          setEntries(updated);
                        }} />
                        <Percent className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeEntry(idx)} className="h-8 w-8 p-0">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} disabled={saving || !name || entries.length === 0} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Dice6 className="h-4 w-4 mr-1" />}
                  Create Loot Table
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {lootTables.map((table) => (
          <motion.div key={table.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50 hover:border-emerald-500/30 transition-colors">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{table.name}</span>
                      <Badge variant="outline" className="text-[10px]">Max {table.max_drops} drops</Badge>
                    </div>
                    {table.description && <p className="text-xs text-muted-foreground">{table.description}</p>}
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {table.entries.map(entry => (
                        <Badge
                          key={entry.id}
                          variant="secondary"
                          className={`text-[10px] ${rarityColor[entry.item_rarity || "common"]}`}
                        >
                          {entry.item_emoji} {entry.item_name} x{entry.quantity} ({entry.drop_chance}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteLootTable(table.id)} className="h-7 w-7 p-0">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {lootTables.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">No loot tables yet. Create one to add randomized item drops!</p>
        )}
      </div>
    </div>
  );
};
