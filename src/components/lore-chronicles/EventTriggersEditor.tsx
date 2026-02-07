import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, Plus, Trash2, Edit, Save, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useEventTriggers,
  TriggerType,
  EventType,
  EventTrigger,
  TRIGGER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from "@/hooks/useEventTriggers";

interface Props {
  campaignId: string;
}

const TRIGGER_TYPE_COLORS: Record<TriggerType, string> = {
  stat_threshold: "bg-blue-500",
  item_possessed: "bg-amber-500",
  flag_set: "bg-green-500",
  relationship_score: "bg-pink-500",
  faction_reputation: "bg-purple-500",
  choice_made: "bg-indigo-500",
  player_count: "bg-cyan-500",
  random_chance: "bg-orange-500",
};

export const EventTriggersEditor = ({ campaignId }: Props) => {
  const { triggers, loading, fetchTriggers, createTrigger, updateTrigger, deleteTrigger, createEvent, deleteEvent } = useEventTriggers(campaignId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set());
  const [selectedTriggerId, setSelectedTriggerId] = useState<string>("");

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTriggerType, setNewTriggerType] = useState<TriggerType>("stat_threshold");
  const [newConditions, setNewConditions] = useState<Record<string, string>>({ stat: "", min_value: "" });

  // Event form state
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("show_message");
  const [eventPayload, setEventPayload] = useState<Record<string, string>>({ message: "" });

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  const toggleExpanded = (id: string) => {
    setExpandedTriggers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getConditionFields = (type: TriggerType) => {
    switch (type) {
      case "stat_threshold":
        return [
          { key: "stat", label: "Stat Name", placeholder: "e.g., strength" },
          { key: "min_value", label: "Minimum Value", placeholder: "e.g., 5", type: "number" },
        ];
      case "item_possessed":
        return [{ key: "item_name", label: "Item Name", placeholder: "e.g., Ancient Key" }];
      case "flag_set":
        return [
          { key: "flag_name", label: "Flag Name", placeholder: "e.g., met_elder" },
          { key: "flag_value", label: "Value", placeholder: "e.g., true" },
        ];
      case "random_chance":
        return [{ key: "probability", label: "Probability (%)", placeholder: "e.g., 30", type: "number" }];
      case "player_count":
        return [{ key: "min_players", label: "Minimum Players", placeholder: "e.g., 3", type: "number" }];
      case "relationship_score":
        return [
          { key: "npc_name", label: "NPC Name", placeholder: "e.g., Kael" },
          { key: "min_score", label: "Minimum Score", placeholder: "e.g., 50", type: "number" },
        ];
      case "faction_reputation":
        return [
          { key: "faction_name", label: "Faction Name", placeholder: "e.g., Shadow Guild" },
          { key: "min_reputation", label: "Minimum Reputation", placeholder: "e.g., 30", type: "number" },
        ];
      case "choice_made":
        return [
          { key: "node_id", label: "Node ID", placeholder: "UUID of the node" },
          { key: "choice_text", label: "Choice Text", placeholder: "e.g., spare the wolf" },
        ];
      default:
        return [];
    }
  };

  const getPayloadFields = (type: EventType) => {
    switch (type) {
      case "show_message":
        return [{ key: "message", label: "Message", placeholder: "Message shown to the player" }];
      case "modify_stat":
        return [
          { key: "stat", label: "Stat Name", placeholder: "e.g., charisma" },
          { key: "change", label: "Change Amount", placeholder: "e.g., +2 or -1" },
        ];
      case "grant_item":
        return [{ key: "item_name", label: "Item Name", placeholder: "e.g., Mystic Amulet" }];
      case "set_flag":
        return [
          { key: "flag_name", label: "Flag Name", placeholder: "e.g., has_key" },
          { key: "flag_value", label: "Value", placeholder: "e.g., true" },
        ];
      case "award_xp":
        return [{ key: "amount", label: "XP Amount", placeholder: "e.g., 50", type: "number" }];
      case "unlock_path":
        return [{ key: "choice_id", label: "Choice ID to Unlock", placeholder: "UUID" }];
      case "spawn_node":
        return [{ key: "node_id", label: "Node ID to Activate", placeholder: "UUID" }];
      default:
        return [];
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const conditions: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(newConditions)) {
      if (v) conditions[k] = isNaN(Number(v)) ? v : Number(v);
    }
    await createTrigger(newName.trim(), newTriggerType, conditions, newDescription.trim() || undefined);
    setNewName("");
    setNewDescription("");
    setNewTriggerType("stat_threshold");
    setNewConditions({ stat: "", min_value: "" });
    setShowCreateDialog(false);
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !selectedTriggerId) return;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(eventPayload)) {
      if (v) payload[k] = isNaN(Number(v)) ? v : Number(v);
    }
    await createEvent(selectedTriggerId, eventName.trim(), eventType, payload);
    setEventName("");
    setEventType("show_message");
    setEventPayload({ message: "" });
    setShowEventDialog(false);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Event Triggers</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Trigger
            </Button>
          </div>
          <CardDescription>
            Define conditions that fire events during gameplay
          </CardDescription>
        </CardHeader>
      </Card>

      {triggers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Triggers Yet</h3>
            <p className="text-muted-foreground mb-4">
              Triggers fire events when conditions are met during gameplay.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Trigger
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger, index) => {
            const isExpanded = expandedTriggers.has(trigger.id);
            const typeInfo = TRIGGER_TYPE_LABELS[trigger.trigger_type];

            return (
              <motion.div
                key={trigger.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={!trigger.is_active ? "opacity-60" : ""}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(trigger.id)}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        <span className={`w-3 h-3 rounded-full shrink-0 ${TRIGGER_TYPE_COLORS[trigger.trigger_type]}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{trigger.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {typeInfo.label}
                            </Badge>
                            {trigger.events && trigger.events.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {trigger.events.length} event{trigger.events.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          {trigger.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{trigger.description}</p>
                          )}
                        </div>

                        <Switch
                          checked={trigger.is_active}
                          onCheckedChange={(active) => updateTrigger(trigger.id, { is_active: active })}
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTrigger(trigger.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CollapsibleContent className="mt-4 space-y-4">
                        {/* Conditions display */}
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Conditions:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(trigger.conditions).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                            {Object.keys(trigger.conditions).length === 0 && (
                              <span className="text-xs text-muted-foreground">No conditions configured</span>
                            )}
                          </div>
                        </div>

                        {/* Events */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Triggered Events</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTriggerId(trigger.id);
                                setShowEventDialog(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Event
                            </Button>
                          </div>

                          {trigger.events && trigger.events.length > 0 ? (
                            <div className="space-y-2">
                              {trigger.events.map((event) => (
                                <div
                                  key={event.id}
                                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                                >
                                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{event.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {EVENT_TYPE_LABELS[event.event_type]?.label}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deleteEvent(event.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No events configured</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Trigger Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Event Trigger</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trigger Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., High Charisma Check"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What does this trigger do?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={newTriggerType}
                onValueChange={(v) => {
                  setNewTriggerType(v as TriggerType);
                  setNewConditions({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPE_LABELS).map(([type, info]) => (
                    <SelectItem key={type} value={type}>
                      <div>
                        <span>{info.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {info.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic condition fields */}
            <div className="space-y-3">
              <Label>Conditions</Label>
              {getConditionFields(newTriggerType).map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    value={newConditions[field.key] || ""}
                    onChange={(e) =>
                      setNewConditions((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Trigger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Triggered Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Name *</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Reveal Secret Path"
              />
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={eventType}
                onValueChange={(v) => {
                  setEventType(v as EventType);
                  setEventPayload({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([type, info]) => (
                    <SelectItem key={type} value={type}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {getPayloadFields(eventType).map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  type={field.type || "text"}
                  value={eventPayload[field.key] || ""}
                  onChange={(e) =>
                    setEventPayload((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} disabled={!eventName.trim()}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
