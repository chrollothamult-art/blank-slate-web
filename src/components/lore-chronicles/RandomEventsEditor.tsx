import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Plus, Trash2, Edit2, Settings, Zap, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useRandomEvents, RandomEvent, RandomEventCategory, CATEGORY_LABELS } from "@/hooks/useRandomEvents";

interface RandomEventsEditorProps {
  campaignId: string;
}

export const RandomEventsEditor = ({ campaignId }: RandomEventsEditorProps) => {
  const {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useRandomEvents(campaignId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RandomEvent | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RandomEventCategory>("encounter");
  const [probability, setProbability] = useState(10);
  const [isRecurring, setIsRecurring] = useState(false);
  const [cooldownTurns, setCooldownTurns] = useState(0);
  const [effectMessage, setEffectMessage] = useState("");
  const [effectStatChange, setEffectStatChange] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("encounter");
    setProbability(10);
    setIsRecurring(false);
    setCooldownTurns(0);
    setEffectMessage("");
    setEffectStatChange("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    const effects: Record<string, unknown> = {};
    if (effectMessage) effects.message = effectMessage;
    if (effectStatChange) {
      const [stat, change] = effectStatChange.split(":");
      if (stat && change) {
        effects.stat_change = { stat: stat.trim(), change: parseInt(change) };
      }
    }

    await createEvent(name, category, probability, {
      description,
      effects,
      is_recurring: isRecurring,
      cooldown_turns: cooldownTurns,
    });

    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (event: RandomEvent) => {
    setEditingEvent(event);
    setName(event.name);
    setDescription(event.description || "");
    setCategory(event.category);
    setProbability(event.probability);
    setIsRecurring(event.is_recurring);
    setCooldownTurns(event.cooldown_turns);
    setEffectMessage((event.effects.message as string) || "");
    const statChange = event.effects.stat_change as { stat: string; change: number } | undefined;
    setEffectStatChange(statChange ? `${statChange.stat}:${statChange.change}` : "");
  };

  const handleUpdate = async () => {
    if (!editingEvent || !name.trim()) return;

    const effects: Record<string, unknown> = {};
    if (effectMessage) effects.message = effectMessage;
    if (effectStatChange) {
      const [stat, change] = effectStatChange.split(":");
      if (stat && change) {
        effects.stat_change = { stat: stat.trim(), change: parseInt(change) };
      }
    }

    await updateEvent(editingEvent.id, {
      name,
      description,
      category,
      probability,
      is_recurring: isRecurring,
      cooldown_turns: cooldownTurns,
      effects,
    });

    resetForm();
    setEditingEvent(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this random event?")) {
      await deleteEvent(id);
    }
  };

  const handleToggleActive = async (event: RandomEvent) => {
    await updateEvent(event.id, { is_active: !event.is_active });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading random events...</div>
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
              <Dice1 className="h-5 w-5 text-primary" />
              Random Events
            </CardTitle>
            <CardDescription>
              Add unpredictability with condition-based random events
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Random Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sudden Storm"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A violent storm suddenly breaks out..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as RandomEventCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                          <SelectItem key={key} value={key}>
                            {icon} {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Probability ({probability}%)</Label>
                    <Slider
                      value={[probability]}
                      onValueChange={([v]) => setProbability(v)}
                      min={1}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                    <Label>Recurring Event</Label>
                  </div>
                  {isRecurring && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Cooldown:</Label>
                      <Input
                        type="number"
                        value={cooldownTurns}
                        onChange={(e) => setCooldownTurns(parseInt(e.target.value) || 0)}
                        className="w-20"
                        min={0}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Effect Message</Label>
                  <Input
                    value={effectMessage}
                    onChange={(e) => setEffectMessage(e.target.value)}
                    placeholder="You find shelter just in time!"
                  />
                </div>
                <div>
                  <Label>Stat Change (e.g., "strength:-1")</Label>
                  <Input
                    value={effectStatChange}
                    onChange={(e) => setEffectStatChange(e.target.value)}
                    placeholder="agility:+1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!name.trim()}>
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Dice1 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No random events yet</p>
            <p className="text-sm">Add events to create unpredictable moments</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    event.is_active ? "bg-card" : "bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_LABELS[event.category].icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{event.name}</p>
                        <Badge variant="outline" className={CATEGORY_LABELS[event.category].color}>
                          {CATEGORY_LABELS[event.category].label}
                        </Badge>
                        <Badge variant="secondary">{event.probability}%</Badge>
                        {event.is_recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={event.is_active}
                      onCheckedChange={() => handleToggleActive(event)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Random Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Event Name</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as RandomEventCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>
                          {icon} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Probability ({probability}%)</Label>
                  <Slider
                    value={[probability]}
                    onValueChange={([v]) => setProbability(v)}
                    min={1}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  <Label>Recurring Event</Label>
                </div>
                {isRecurring && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Cooldown:</Label>
                    <Input
                      type="number"
                      value={cooldownTurns}
                      onChange={(e) => setCooldownTurns(parseInt(e.target.value) || 0)}
                      className="w-20"
                      min={0}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>Effect Message</Label>
                <Input
                  value={effectMessage}
                  onChange={(e) => setEffectMessage(e.target.value)}
                />
              </div>
              <div>
                <Label>Stat Change (e.g., "strength:-1")</Label>
                <Input
                  value={effectStatChange}
                  onChange={(e) => setEffectStatChange(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!name.trim()}>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RandomEventsEditor;
