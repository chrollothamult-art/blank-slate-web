import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Users, Sparkles, BookHeart, Sword, ScrollText,
  Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp,
  Wand2, Shield, Gem, Flag, Crown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCustomWorldBuilder, CustomRace, CustomMagic, CustomBelief, CustomItem, CustomFaction, FactionRank } from "@/hooks/useCustomWorldBuilder";

const DEFAULT_STATS = ["Strength", "Magic", "Charisma", "Wisdom", "Agility", "Endurance"];
const ITEM_TYPES = ["weapon", "armor", "consumable", "artifact", "tool", "misc"];
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

interface WorldBuilderProps {
  campaignId: string;
}

export const WorldBuilder = ({ campaignId }: WorldBuilderProps) => {
  const {
    universeSettings, races, magicSystems, beliefs, items, factions, loading,
    saveUniverseSettings, addRace, updateRace, deleteRace,
    addMagic, updateMagic, deleteMagic,
    addBelief, updateBelief, deleteBelief,
    addItem, updateItem, deleteItem,
    addFaction, updateFaction, deleteFaction,
  } = useCustomWorldBuilder(campaignId);

  const [rulesDoc, setRulesDoc] = useState("");
  const [customStats, setCustomStats] = useState<string[]>([]);
  const [worldName, setWorldName] = useState("");
  const [worldDesc, setWorldDesc] = useState("");
  const [rulesLoaded, setRulesLoaded] = useState(false);

  // Load settings into local state once
  if (universeSettings && !rulesLoaded) {
    setRulesDoc(universeSettings.rules_document || "");
    setWorldName(universeSettings.world_name || "");
    setWorldDesc(universeSettings.world_description || "");
    const stats = universeSettings.custom_stats as { stats?: string[] };
    setCustomStats(stats?.stats || []);
    setRulesLoaded(true);
  }

  const handleSaveSettings = () => {
    saveUniverseSettings({
      mode: "original",
      world_name: worldName || null,
      world_description: worldDesc || null,
      rules_document: rulesDoc || null,
      custom_stats: { stats: customStats.length > 0 ? customStats : DEFAULT_STATS },
    });
  };

  if (loading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading world builder...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Custom World Builder
          </CardTitle>
          <CardDescription>
            Define everything about your original universe — races, magic, beliefs, items, and rules.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" />Overview & Rules</TabsTrigger>
          <TabsTrigger value="races" className="gap-1.5"><Users className="h-3.5 w-3.5" />Races ({races.length})</TabsTrigger>
          <TabsTrigger value="magic" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" />Magic ({magicSystems.length})</TabsTrigger>
          <TabsTrigger value="beliefs" className="gap-1.5"><BookHeart className="h-3.5 w-3.5" />Beliefs ({beliefs.length})</TabsTrigger>
          <TabsTrigger value="items" className="gap-1.5"><Sword className="h-3.5 w-3.5" />Items ({items.length})</TabsTrigger>
          <TabsTrigger value="factions" className="gap-1.5"><Flag className="h-3.5 w-3.5" />Factions ({factions.length})</TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Custom Stats</TabsTrigger>
        </TabsList>

        {/* Overview & Rules */}
        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>World Name</Label>
                <Input value={worldName} onChange={(e) => setWorldName(e.target.value)} placeholder="The Realm of Shadows" />
              </div>
              <div className="space-y-2">
                <Label>World Description</Label>
                <Textarea value={worldDesc} onChange={(e) => setWorldDesc(e.target.value)} placeholder="A brief description of your world..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>World Rules Document</Label>
                <p className="text-xs text-muted-foreground">Players will see this before joining. Describe the physics, history, societal norms, and any unique rules of your world.</p>
                <Textarea value={rulesDoc} onChange={(e) => setRulesDoc(e.target.value)} placeholder="In this world, magic flows through ancient ley lines..." rows={8} maxLength={5000} />
                <p className="text-xs text-muted-foreground text-right">{rulesDoc.length}/5000</p>
              </div>
              <Button onClick={handleSaveSettings}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Races */}
        <TabsContent value="races">
          <CrudSection
            title="Custom Races"
            description="Define the playable races in your universe"
            icon={<Users className="h-5 w-5 text-primary" />}
            items={races}
            onAdd={addRace}
            onUpdate={updateRace}
            onDelete={deleteRace}
            renderForm={(item, onChange) => (
              <div className="space-y-3">
                <div className="space-y-1"><Label>Name *</Label><Input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="Shadowkin" /></div>
                <div className="space-y-1"><Label>Description</Label><Textarea value={item.description || ""} onChange={(e) => onChange({ ...item, description: e.target.value })} placeholder="Ancient beings of shadow..." rows={3} /></div>
                <div className="space-y-1"><Label>Lore</Label><Textarea value={item.lore || ""} onChange={(e) => onChange({ ...item, lore: e.target.value })} placeholder="Their origins trace back to..." rows={4} /></div>
                <div className="space-y-1"><Label>Image URL</Label><Input value={item.image_url || ""} onChange={(e) => onChange({ ...item, image_url: e.target.value })} placeholder="https://..." /></div>
                <div className="space-y-2">
                  <Label>Stat Bonuses</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(customStats.length > 0 ? customStats : DEFAULT_STATS).map(stat => (
                      <div key={stat} className="flex items-center gap-2">
                        <span className="text-sm w-20">{stat}</span>
                        <Input type="number" className="w-20" value={item.stat_bonuses?.[stat.toLowerCase()] || 0} onChange={(e) => onChange({ ...item, stat_bonuses: { ...item.stat_bonuses, [stat.toLowerCase()]: parseInt(e.target.value) || 0 } })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            renderCard={(item) => (
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description || "No description"}</p>
                {Object.entries(item.stat_bonuses || {}).filter(([, v]) => v !== 0).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(item.stat_bonuses).filter(([, v]) => v !== 0).map(([k, v]) => (
                      <Badge key={k} variant={v > 0 ? "default" : "destructive"} className="text-xs">{k}: {v > 0 ? `+${v}` : v}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            emptyDefaults={{ name: "", description: null, stat_bonuses: {}, image_url: null, lore: null }}
          />
        </TabsContent>

        {/* Magic */}
        <TabsContent value="magic">
          <CrudSection
            title="Magic Systems"
            description="Define the types of magic available in your world"
            icon={<Wand2 className="h-5 w-5 text-primary" />}
            items={magicSystems}
            onAdd={addMagic}
            onUpdate={updateMagic}
            onDelete={deleteMagic}
            renderForm={(item, onChange) => (
              <div className="space-y-3">
                <div className="space-y-1"><Label>Name *</Label><Input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="Arcane Weaving" /></div>
                <div className="space-y-1"><Label>Magic Type</Label><Input value={item.magic_type || ""} onChange={(e) => onChange({ ...item, magic_type: e.target.value })} placeholder="Elemental, Divine, Arcane..." /></div>
                <div className="space-y-1"><Label>Rules</Label><Textarea value={item.rules || ""} onChange={(e) => onChange({ ...item, rules: e.target.value })} placeholder="How this magic works, its limitations..." rows={4} /></div>
              </div>
            )}
            renderCard={(item) => (
              <div>
                <p className="font-medium">{item.name}</p>
                {item.magic_type && <Badge variant="outline" className="text-xs mt-1">{item.magic_type}</Badge>}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.rules || "No rules defined"}</p>
              </div>
            )}
            emptyDefaults={{ name: "", magic_type: null, rules: null, casting_cost: {}, effects: {} }}
          />
        </TabsContent>

        {/* Beliefs */}
        <TabsContent value="beliefs">
          <CrudSection
            title="Beliefs & Religions"
            description="Define the spiritual systems of your world"
            icon={<BookHeart className="h-5 w-5 text-primary" />}
            items={beliefs}
            onAdd={addBelief}
            onUpdate={updateBelief}
            onDelete={deleteBelief}
            renderForm={(item, onChange) => (
              <div className="space-y-3">
                <div className="space-y-1"><Label>Religion/Belief Name *</Label><Input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="The Old Faith" /></div>
                <div className="space-y-1"><Label>Deity Name</Label><Input value={item.deity_name || ""} onChange={(e) => onChange({ ...item, deity_name: e.target.value })} placeholder="Solara, the Sun Goddess" /></div>
                <div className="space-y-1"><Label>Description</Label><Textarea value={item.description || ""} onChange={(e) => onChange({ ...item, description: e.target.value })} placeholder="Followers believe in..." rows={4} /></div>
              </div>
            )}
            renderCard={(item) => (
              <div>
                <p className="font-medium">{item.name}</p>
                {item.deity_name && <p className="text-sm text-primary">Deity: {item.deity_name}</p>}
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description || "No description"}</p>
              </div>
            )}
            emptyDefaults={{ name: "", deity_name: null, description: null, rituals: [], divine_powers: [] }}
          />
        </TabsContent>

        {/* Items */}
        <TabsContent value="items">
          <CrudSection
            title="Custom Items & Weapons"
            description="Define unique weapons, armor, consumables, and artifacts"
            icon={<Sword className="h-5 w-5 text-primary" />}
            items={items}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            renderForm={(item, onChange) => (
              <div className="space-y-3">
                <div className="space-y-1"><Label>Name *</Label><Input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="Shadowblade" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={item.item_type} onValueChange={(v) => onChange({ ...item, item_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Rarity</Label>
                    <Select value={item.rarity} onValueChange={(v) => onChange({ ...item, rarity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RARITIES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Description</Label><Textarea value={item.description || ""} onChange={(e) => onChange({ ...item, description: e.target.value })} placeholder="A blade forged in shadow..." rows={3} /></div>
                <div className="space-y-1"><Label>Icon URL</Label><Input value={item.icon_url || ""} onChange={(e) => onChange({ ...item, icon_url: e.target.value })} placeholder="https://..." /></div>
              </div>
            )}
            renderCard={(item) => (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">{item.item_type}</Badge>
                    <Badge variant="secondary" className="text-xs capitalize">{item.rarity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description || "No description"}</p>
                </div>
              </div>
            )}
            emptyDefaults={{ name: "", item_type: "misc", description: null, effects: {}, rarity: "common", icon_url: null }}
          />
        </TabsContent>

        {/* Factions */}
        <TabsContent value="factions">
          <FactionsSection
            factions={factions}
            onAdd={addFaction}
            onUpdate={updateFaction}
            onDelete={deleteFaction}
          />
        </TabsContent>

        {/* Custom Stats */}
        <TabsContent value="stats">
          <CustomStatsEditor stats={customStats} onChange={setCustomStats} onSave={handleSaveSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Factions Section with Ranks ---

interface FactionsSectionProps {
  factions: CustomFaction[];
  onAdd: (faction: Omit<CustomFaction, "id" | "campaign_id">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<CustomFaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FactionsSection = ({ factions, onAdd, onUpdate, onDelete }: FactionsSectionProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<CustomFaction, "id" | "campaign_id">>({
    name: "",
    description: null,
    goals: null,
    image_url: null,
    ranks: [],
    perks: {},
    conflicts: [],
  });

  const handleAdd = async () => {
    if (!formData.name?.trim()) return;
    await onAdd(formData);
    setFormData({ name: "", description: null, goals: null, image_url: null, ranks: [], perks: {}, conflicts: [] });
    setShowAdd(false);
  };

  const handleEdit = (faction: CustomFaction) => {
    const { id, campaign_id, ...rest } = faction;
    setFormData(rest);
    setEditId(id);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    await onUpdate(editId, formData);
    setEditId(null);
    setFormData({ name: "", description: null, goals: null, image_url: null, ranks: [], perks: {}, conflicts: [] });
  };

  const addRank = () => {
    setFormData({
      ...formData,
      ranks: [...formData.ranks, { name: "", level: formData.ranks.length + 1, description: "", perks: [] }]
    });
  };

  const updateRank = (index: number, updates: Partial<FactionRank>) => {
    const newRanks = [...formData.ranks];
    newRanks[index] = { ...newRanks[index], ...updates };
    setFormData({ ...formData, ranks: newRanks });
  };

  const removeRank = (index: number) => {
    setFormData({ ...formData, ranks: formData.ranks.filter((_, i) => i !== index) });
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Faction Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="The Shadow Guild" />
        </div>
        <div className="space-y-1">
          <Label>Image URL</Label>
          <Input value={formData.image_url || ""} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="A secretive organization that..." rows={3} />
      </div>
      <div className="space-y-1">
        <Label>Goals & Motivations</Label>
        <Textarea value={formData.goals || ""} onChange={(e) => setFormData({ ...formData, goals: e.target.value })} placeholder="The faction seeks to..." rows={2} />
      </div>

      {/* Ranks Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2"><Crown className="h-4 w-4" />Ranks & Titles</Label>
          <Button size="sm" variant="outline" onClick={addRank}><Plus className="h-3 w-3 mr-1" />Add Rank</Button>
        </div>
        {formData.ranks.length === 0 && (
          <p className="text-sm text-muted-foreground">No ranks defined. Add ranks to create a hierarchy.</p>
        )}
        <div className="space-y-2">
          {formData.ranks.map((rank, index) => (
            <Card key={index} className="border-muted">
              <CardContent className="pt-3 pb-3">
                <div className="flex gap-2 items-start">
                  <Badge variant="outline" className="shrink-0">Lvl {rank.level}</Badge>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={rank.name}
                      onChange={(e) => updateRank(index, { name: e.target.value })}
                      placeholder="Rank name (e.g., Initiate, Master)"
                      className="h-8"
                    />
                    <Input
                      value={rank.description}
                      onChange={(e) => updateRank(index, { description: e.target.value })}
                      placeholder="What this rank means..."
                      className="h-8 text-sm"
                    />
                    <Input
                      value={rank.perks.join(", ")}
                      onChange={(e) => updateRank(index, { perks: e.target.value.split(",").map(p => p.trim()).filter(Boolean) })}
                      placeholder="Perks (comma-separated)"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeRank(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-primary" />Custom Factions</CardTitle>
            <CardDescription>Define factions, organizations, and their rank hierarchies</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setFormData({ name: "", description: null, goals: null, image_url: null, ranks: [], perks: {}, conflicts: [] }); setShowAdd(true); }}>
            <Plus className="h-4 w-4 mr-1" />Add Faction
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {factions.length === 0 && !showAdd && (
          <p className="text-center text-muted-foreground py-8">No factions defined yet. Click "Add Faction" to create one.</p>
        )}

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium">New Faction</p>
                  {renderForm()}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={handleAdd} disabled={!formData.name?.trim()}><Save className="h-4 w-4 mr-1" />Save</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {factions.map((faction) => (
          <motion.div key={faction.id} layout>
            {editId === faction.id ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium">Edit Faction</p>
                  {renderForm()}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit}><Save className="h-4 w-4 mr-1" />Save</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:border-primary/20 transition-colors">
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{faction.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{faction.description || "No description"}</p>
                    {faction.ranks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {faction.ranks.map((rank, i) => (
                          <Badge key={i} variant="secondary" className="text-xs gap-1">
                            <Crown className="h-2.5 w-2.5" />{rank.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(faction)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(faction.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

// --- Generic CRUD Section ---

interface CrudSectionProps<T extends { id: string; campaign_id: string; name: string }> {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: T[];
  onAdd: (item: Omit<T, "id" | "campaign_id">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<T>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  renderForm: (item: Omit<T, "id" | "campaign_id">, onChange: (item: Omit<T, "id" | "campaign_id">) => void) => React.ReactNode;
  renderCard: (item: T) => React.ReactNode;
  emptyDefaults: Omit<T, "id" | "campaign_id">;
}

function CrudSection<T extends { id: string; campaign_id: string; name: string }>({
  title, description, icon, items, onAdd, onUpdate, onDelete, renderForm, renderCard, emptyDefaults
}: CrudSectionProps<T>) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<T, "id" | "campaign_id">>(emptyDefaults);

  const handleAdd = async () => {
    if (!(formData as { name: string }).name?.trim()) return;
    await onAdd(formData);
    setFormData(emptyDefaults);
    setShowAdd(false);
  };

  const handleEdit = (item: T) => {
    const { id, campaign_id, ...rest } = item as T & { id: string; campaign_id: string };
    setFormData(rest as Omit<T, "id" | "campaign_id">);
    setEditId(item.id);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    await onUpdate(editId, formData as Partial<T>);
    setEditId(null);
    setFormData(emptyDefaults);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setFormData(emptyDefaults); setShowAdd(true); }}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && !showAdd && (
          <p className="text-center text-muted-foreground py-8">No {title.toLowerCase()} defined yet. Click "Add" to create one.</p>
        )}

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium">New {title.replace(/s$/, "")}</p>
                  {renderForm(formData, setFormData)}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={handleAdd} disabled={!(formData as { name: string }).name?.trim()}><Save className="h-4 w-4 mr-1" />Save</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {items.map((item) => (
          <motion.div key={item.id} layout>
            {editId === item.id ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium">Edit {title.replace(/s$/, "")}</p>
                  {renderForm(formData, setFormData)}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit}><Save className="h-4 w-4 mr-1" />Save</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:border-primary/20 transition-colors">
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div className="flex-1">{renderCard(item)}</div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

// --- Custom Stats Editor ---

const CustomStatsEditor = ({ stats, onChange, onSave }: { stats: string[]; onChange: (s: string[]) => void; onSave: () => void }) => {
  const [newStat, setNewStat] = useState("");

  const addStat = () => {
    if (!newStat.trim() || stats.includes(newStat.trim())) return;
    onChange([...stats, newStat.trim()]);
    setNewStat("");
  };

  const removeStat = (stat: string) => onChange(stats.filter(s => s !== stat));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Custom Stat System</CardTitle>
        <CardDescription>Override the default stats (Strength, Magic, Charisma, Wisdom, Agility, Endurance) with your own.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default Stats (used if no custom stats defined)</Label>
          <div className="flex flex-wrap gap-1">
            {DEFAULT_STATS.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Your Custom Stats {stats.length > 0 && `(${stats.length})`}</Label>
          <div className="flex flex-wrap gap-1">
            {stats.map(s => (
              <Badge key={s} variant="default" className="gap-1">
                {s}
                <button onClick={() => removeStat(s)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            {stats.length === 0 && <p className="text-sm text-muted-foreground">Using default stats</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <Input value={newStat} onChange={(e) => setNewStat(e.target.value)} placeholder="New stat name..." onKeyDown={(e) => e.key === "Enter" && addStat()} className="max-w-xs" />
          <Button size="sm" variant="outline" onClick={addStat} disabled={!newStat.trim()}><Plus className="h-4 w-4 mr-1" />Add Stat</Button>
        </div>

        <Button onClick={onSave}><Save className="h-4 w-4 mr-2" />Save Stats Configuration</Button>
      </CardContent>
    </Card>
  );
};
