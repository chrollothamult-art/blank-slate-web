import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Trash2, Edit2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useInteractionPoints,
  InteractionPoint,
  InteractionType,
  OutcomeResult,
  INTERACTION_TYPE_LABELS,
} from "@/hooks/useInteractionPoints";

interface InteractionPointsEditorProps {
  campaignId: string;
}

export const InteractionPointsEditor = ({ campaignId }: InteractionPointsEditorProps) => {
  const {
    interactions,
    loading,
    fetchInteractions,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    createOutcome,
    deleteOutcome,
  } = useInteractionPoints(campaignId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingOutcomeFor, setAddingOutcomeFor] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [interactionType, setInteractionType] = useState<InteractionType>("dialogue");
  const [statRequirements, setStatRequirements] = useState("");

  // Outcome form state
  const [outcomeRole, setOutcomeRole] = useState("player");
  const [outcomeResult, setOutcomeResult] = useState<OutcomeResult>("neutral");
  const [outcomeNarrative, setOutcomeNarrative] = useState("");
  const [outcomeStatEffects, setOutcomeStatEffects] = useState("");

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setInteractionType("dialogue");
    setStatRequirements("");
  };

  const resetOutcomeForm = () => {
    setOutcomeRole("player");
    setOutcomeResult("neutral");
    setOutcomeNarrative("");
    setOutcomeStatEffects("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    const statReqs: Record<string, number> = {};
    if (statRequirements) {
      statRequirements.split(",").forEach((req) => {
        const [stat, value] = req.split(":").map((s) => s.trim());
        if (stat && value) {
          statReqs[stat] = parseInt(value);
        }
      });
    }

    await createInteraction(name, interactionType, {
      description,
      stat_requirements: statReqs,
    });

    resetForm();
    setIsCreateOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this interaction point?")) {
      await deleteInteraction(id);
    }
  };

  const handleAddOutcome = async (interactionId: string) => {
    const statEffects: Record<string, number> = {};
    if (outcomeStatEffects) {
      outcomeStatEffects.split(",").forEach((effect) => {
        const [stat, value] = effect.split(":").map((s) => s.trim());
        if (stat && value) {
          statEffects[stat] = parseInt(value);
        }
      });
    }

    await createOutcome(interactionId, outcomeResult, outcomeRole, {
      narrative_text: outcomeNarrative,
      stat_effects: statEffects,
    });

    resetOutcomeForm();
    setAddingOutcomeFor(null);
  };

  const handleDeleteOutcome = async (outcomeId: string) => {
    if (confirm("Delete this outcome?")) {
      await deleteOutcome(outcomeId);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading interaction points...</div>
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
              <MessageSquare className="h-5 w-5 text-primary" />
              Interaction Points
            </CardTitle>
            <CardDescription>
              Define character-to-character interactions with dual outcomes
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Interaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Interaction Point</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Interaction Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Meeting with the Elder"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A crucial conversation that could change your fate..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Interaction Type</Label>
                  <Select
                    value={interactionType}
                    onValueChange={(v) => setInteractionType(v as InteractionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERACTION_TYPE_LABELS).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>
                          {icon} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stat Requirements (e.g., "charisma:4, strength:3")</Label>
                  <Input
                    value={statRequirements}
                    onChange={(e) => setStatRequirements(e.target.value)}
                    placeholder="charisma:4"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!name.trim()}>
                  Create Interaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No interaction points yet</p>
            <p className="text-sm">Create interactions to enable character encounters</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {interactions.map((interaction, index) => (
                <motion.div
                  key={interaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Collapsible
                    open={expandedId === interaction.id}
                    onOpenChange={(open) => setExpandedId(open ? interaction.id : null)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {INTERACTION_TYPE_LABELS[interaction.interaction_type].icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{interaction.name}</p>
                                <Badge
                                  variant="outline"
                                  className={INTERACTION_TYPE_LABELS[interaction.interaction_type].color}
                                >
                                  {INTERACTION_TYPE_LABELS[interaction.interaction_type].label}
                                </Badge>
                                <Badge variant="secondary">
                                  {interaction.outcomes?.length || 0} outcomes
                                </Badge>
                              </div>
                              {interaction.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {interaction.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(interaction.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            {expandedId === interaction.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t p-4 bg-muted/10 space-y-4">
                          {/* Stat requirements */}
                          {Object.keys(interaction.stat_requirements).length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Requirements:</p>
                              <div className="flex gap-2 flex-wrap">
                                {Object.entries(interaction.stat_requirements).map(([stat, value]) => (
                                  <Badge key={stat} variant="secondary">
                                    {stat}: {value}+
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Outcomes */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">Outcomes:</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAddingOutcomeFor(interaction.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Outcome
                              </Button>
                            </div>

                            {interaction.outcomes && interaction.outcomes.length > 0 ? (
                              <div className="space-y-2">
                                {interaction.outcomes.map((outcome) => (
                                  <div
                                    key={outcome.id}
                                    className={`flex items-start justify-between p-3 rounded-lg border ${
                                      outcome.result_type === "good"
                                        ? "border-green-500/30 bg-green-500/5"
                                        : outcome.result_type === "bad"
                                        ? "border-red-500/30 bg-red-500/5"
                                        : "border-border"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge
                                          variant={
                                            outcome.result_type === "good"
                                              ? "default"
                                              : outcome.result_type === "bad"
                                              ? "destructive"
                                              : "secondary"
                                          }
                                        >
                                          {outcome.result_type.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          for {outcome.participant_role}
                                        </span>
                                      </div>
                                      {outcome.narrative_text && (
                                        <p className="text-sm">{outcome.narrative_text}</p>
                                      )}
                                      {Object.keys(outcome.stat_effects).length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                          {Object.entries(outcome.stat_effects).map(([stat, val]) => (
                                            <Badge key={stat} variant="outline" className="text-xs">
                                              {stat}: {val > 0 ? `+${val}` : val}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleDeleteOutcome(outcome.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No outcomes defined yet
                              </p>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Outcome Dialog */}
        <Dialog open={!!addingOutcomeFor} onOpenChange={(open) => !open && setAddingOutcomeFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Outcome</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Participant Role</Label>
                  <Select value={outcomeRole} onValueChange={setOutcomeRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="npc">NPC</SelectItem>
                      <SelectItem value="initiator">Initiator</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Result Type</Label>
                  <Select
                    value={outcomeResult}
                    onValueChange={(v) => setOutcomeResult(v as OutcomeResult)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">✅ Good</SelectItem>
                      <SelectItem value="bad">❌ Bad</SelectItem>
                      <SelectItem value="neutral">➖ Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Narrative Text</Label>
                <Textarea
                  value={outcomeNarrative}
                  onChange={(e) => setOutcomeNarrative(e.target.value)}
                  placeholder="The elder nods approvingly and reveals a secret..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Stat Effects (e.g., "charisma:+1, strength:-1")</Label>
                <Input
                  value={outcomeStatEffects}
                  onChange={(e) => setOutcomeStatEffects(e.target.value)}
                  placeholder="charisma:+1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingOutcomeFor(null)}>
                Cancel
              </Button>
              <Button onClick={() => addingOutcomeFor && handleAddOutcome(addingOutcomeFor)}>
                Add Outcome
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InteractionPointsEditor;
