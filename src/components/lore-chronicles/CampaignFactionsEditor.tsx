import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Trash2, Edit2, Users, Swords, Handshake, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useCampaignFactions,
  CampaignFaction,
  FactionRelationType,
  RELATION_TYPE_LABELS,
} from "@/hooks/useCampaignFactions";

interface CampaignFactionsEditorProps {
  campaignId: string;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
];

export const CampaignFactionsEditor = ({ campaignId }: CampaignFactionsEditorProps) => {
  const {
    factions,
    relations,
    loading,
    fetchAll,
    createFaction,
    updateFaction,
    deleteFaction,
    setRelation,
    deleteRelation,
  } = useCampaignFactions(campaignId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState<CampaignFaction | null>(null);
  const [isRelationsOpen, setIsRelationsOpen] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isJoinable, setIsJoinable] = useState(true);
  const [perks, setPerks] = useState("");

  // Relation form state
  const [factionA, setFactionA] = useState("");
  const [factionB, setFactionB] = useState("");
  const [relationType, setRelationType] = useState<FactionRelationType>("neutral");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
    setIsJoinable(true);
    setPerks("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    const perksList = perks
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => {
        const [level, perk] = p.split(":").map((s) => s.trim());
        return { level: level || "friendly", perk: perk || p };
      });

    await createFaction(name, {
      description,
      color,
      is_joinable: isJoinable,
      perks: perksList,
    });

    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (faction: CampaignFaction) => {
    setEditingFaction(faction);
    setName(faction.name);
    setDescription(faction.description || "");
    setColor(faction.color);
    setIsJoinable(faction.is_joinable);
    setPerks(faction.perks.map((p) => `${p.level}:${p.perk}`).join("\n"));
  };

  const handleUpdate = async () => {
    if (!editingFaction || !name.trim()) return;

    const perksList = perks
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => {
        const [level, perk] = p.split(":").map((s) => s.trim());
        return { level: level || "friendly", perk: perk || p };
      });

    await updateFaction(editingFaction.id, {
      name,
      description,
      color,
      is_joinable: isJoinable,
      perks: perksList,
    });

    resetForm();
    setEditingFaction(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this faction?")) {
      await deleteFaction(id);
    }
  };

  const handleSetRelation = async () => {
    if (!factionA || !factionB || factionA === factionB) return;
    await setRelation(factionA, factionB, relationType);
    setFactionA("");
    setFactionB("");
    setRelationType("neutral");
  };

  const getRelationBetween = (aId: string, bId: string): FactionRelationType | null => {
    const relation = relations.find(
      (r) =>
        (r.faction_a_id === aId && r.faction_b_id === bId) ||
        (r.faction_a_id === bId && r.faction_b_id === aId)
    );
    return relation?.relation_type || null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading factions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Campaign Factions
            </CardTitle>
            <CardDescription>
              Define factions players can join, betray, or oppose
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRelationsOpen(true)}
              disabled={factions.length < 2}
            >
              <Users className="h-4 w-4 mr-1" />
              Relations
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Faction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Faction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Faction Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="The Shadow Guild"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A secretive organization operating in the shadows..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`h-8 w-8 rounded-full border-2 ${
                            color === c ? "border-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isJoinable} onCheckedChange={setIsJoinable} />
                    <Label>Players can join this faction</Label>
                  </div>
                  <div>
                    <Label>Perks (format: level:perk, one per line)</Label>
                    <Textarea
                      value={perks}
                      onChange={(e) => setPerks(e.target.value)}
                      placeholder="friendly:10% discount at guild shops&#10;honored:Access to secret passages&#10;exalted:Guild master's blessing"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!name.trim()}>
                    Create Faction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {factions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No factions yet</p>
            <p className="text-sm">Create factions to add political depth to your campaign</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {factions.map((faction, index) => (
                <motion.div
                  key={faction.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg overflow-hidden"
                  style={{ borderLeftColor: faction.color, borderLeftWidth: 4 }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: faction.color }}
                        />
                        <h4 className="font-semibold">{faction.name}</h4>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(faction)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDelete(faction.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {faction.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {faction.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {faction.is_joinable ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                          Joinable
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Joinable
                        </Badge>
                      )}
                      {faction.perks.length > 0 && (
                        <Badge variant="secondary">{faction.perks.length} perks</Badge>
                      )}
                      {/* Show relations */}
                      {factions
                        .filter((f) => f.id !== faction.id)
                        .map((otherFaction) => {
                          const relation = getRelationBetween(faction.id, otherFaction.id);
                          if (!relation || relation === "neutral") return null;
                          return (
                            <Badge
                              key={otherFaction.id}
                              variant="outline"
                              className={`text-xs ${RELATION_TYPE_LABELS[relation].color}`}
                            >
                              {RELATION_TYPE_LABELS[relation].icon} {otherFaction.name}
                            </Badge>
                          );
                        })}
                    </div>

                    {/* Show perks preview */}
                    {faction.perks.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Perks:</p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {faction.perks.slice(0, 2).map((p, i) => (
                            <p key={i} className="line-clamp-1">
                              <span className="capitalize">{p.level}:</span> {p.perk}
                            </p>
                          ))}
                          {faction.perks.length > 2 && (
                            <p className="text-primary">+{faction.perks.length - 2} more...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}</AnimatePresence>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingFaction} onOpenChange={(open) => !open && setEditingFaction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Faction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Faction Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 ${
                        color === c ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isJoinable} onCheckedChange={setIsJoinable} />
                <Label>Players can join this faction</Label>
              </div>
              <div>
                <Label>Perks (format: level:perk, one per line)</Label>
                <Textarea
                  value={perks}
                  onChange={(e) => setPerks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFaction(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!name.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Relations Dialog */}
        <Dialog open={isRelationsOpen} onOpenChange={setIsRelationsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Faction Relations</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Add new relation */}
              <div className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-2">
                  <Label>Faction A</Label>
                  <Select value={factionA} onValueChange={setFactionA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {factions.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={relationType}
                    onValueChange={(v) => setRelationType(v as FactionRelationType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allied">🤝 Allied</SelectItem>
                      <SelectItem value="neutral">➖ Neutral</SelectItem>
                      <SelectItem value="hostile">⚔️ Hostile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Faction B</Label>
                  <Select value={factionB} onValueChange={setFactionB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {factions.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleSetRelation}
                disabled={!factionA || !factionB || factionA === factionB}
                className="w-full"
              >
                Set Relation
              </Button>

              {/* Existing relations */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Current Relations:</p>
                {relations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No relations defined</p>
                ) : (
                  <div className="space-y-2">
                    {relations.map((rel) => {
                      const fA = factions.find((f) => f.id === rel.faction_a_id);
                      const fB = factions.find((f) => f.id === rel.faction_b_id);
                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{fA?.name}</span>
                            <Badge
                              variant="outline"
                              className={RELATION_TYPE_LABELS[rel.relation_type].color}
                            >
                              {RELATION_TYPE_LABELS[rel.relation_type].icon}{" "}
                              {RELATION_TYPE_LABELS[rel.relation_type].label}
                            </Badge>
                            <span className="font-medium">{fB?.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteRelation(rel.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CampaignFactionsEditor;
