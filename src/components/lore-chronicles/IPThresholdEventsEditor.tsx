import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Plus, Trash2, Edit, Save, X, AlertTriangle,
  Handshake, Swords, Gift, Ban, GitBranch, Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useIPThresholdEvents, IPThresholdEvent, RELATIONSHIP_LEVEL_CONFIG } from "@/hooks/useIPScores";

interface IPThresholdEventsEditorProps {
  campaignId: string;
}

const EVENT_TYPE_CONFIG: Record<IPThresholdEvent["event_type"], { label: string; icon: React.ReactNode; color: string }> = {
  forced_choice: { label: "Forced Choice", icon: <AlertTriangle className="h-4 w-4" />, color: "text-orange-500" },
  alliance: { label: "Alliance", icon: <Handshake className="h-4 w-4" />, color: "text-blue-500" },
  duel: { label: "Duel", icon: <Swords className="h-4 w-4" />, color: "text-red-500" },
  bonus: { label: "Bonus", icon: <Gift className="h-4 w-4" />, color: "text-green-500" },
  penalty: { label: "Penalty", icon: <Ban className="h-4 w-4" />, color: "text-red-400" },
  unlock_path: { label: "Unlock Path", icon: <GitBranch className="h-4 w-4" />, color: "text-purple-500" },
};

export const IPThresholdEventsEditor = ({ campaignId }: IPThresholdEventsEditorProps) => {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useIPThresholdEvents(campaignId);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    threshold_min: -100,
    threshold_max: -75,
    event_type: "forced_choice" as IPThresholdEvent["event_type"],
    description: "",
    is_mandatory: false,
  });

  const resetForm = () => {
    setForm({
      name: "",
      threshold_min: -100,
      threshold_max: -75,
      event_type: "forced_choice",
      description: "",
      is_mandatory: false,
    });
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createEvent(
      form.name,
      form.threshold_min,
      form.threshold_max,
      form.event_type,
      {
        description: form.description || undefined,
        is_mandatory: form.is_mandatory,
      }
    );
    resetForm();
    setShowAdd(false);
  };

  const handleEdit = (event: IPThresholdEvent) => {
    setForm({
      name: event.name,
      threshold_min: event.threshold_min,
      threshold_max: event.threshold_max,
      event_type: event.event_type,
      description: event.description || "",
      is_mandatory: event.is_mandatory,
    });
    setEditId(event.id);
  };

  const handleUpdate = async () => {
    if (!editId || !form.name.trim()) return;
    await updateEvent(editId, {
      name: form.name,
      threshold_min: form.threshold_min,
      threshold_max: form.threshold_max,
      event_type: form.event_type,
      description: form.description || null,
      is_mandatory: form.is_mandatory,
    });
    resetForm();
    setEditId(null);
  };

  const getThresholdLabel = (min: number, max: number) => {
    for (const [key, config] of Object.entries(RELATIONSHIP_LEVEL_CONFIG)) {
      if (min >= config.minScore && max <= config.maxScore) {
        return config.label;
      }
    }
    return "Custom Range";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-muted-foreground">Loading IP events...</p>
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
              <Zap className="h-5 w-5 text-primary" />
              IP Threshold Events
            </CardTitle>
            <CardDescription>
              Define events that trigger when character relationships reach specific levels
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        <AnimatePresence>
          {(showAdd || editId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm font-medium">
                    {editId ? "Edit Event" : "New IP Threshold Event"}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Name *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Blood Feud Confrontation"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select
                        value={form.event_type}
                        onValueChange={(v) => setForm({ ...form, event_type: v as IPThresholdEvent["event_type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span className={config.color}>{config.icon}</span>
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>IP Score Range</Label>
                      <Badge variant="outline">
                        {form.threshold_min} to {form.threshold_max}
                        <span className="ml-1 text-muted-foreground">
                          ({getThresholdLabel(form.threshold_min, form.threshold_max)})
                        </span>
                      </Badge>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[form.threshold_min, form.threshold_max]}
                        min={-100}
                        max={100}
                        step={5}
                        onValueChange={([min, max]) => setForm({ ...form, threshold_min: min, threshold_max: max })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>-100 (Blood Feud)</span>
                        <span>0</span>
                        <span>+100 (Sworn)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="What happens when this event triggers..."
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_mandatory}
                      onCheckedChange={(v) => setForm({ ...form, is_mandatory: v })}
                    />
                    <Label className="cursor-pointer">
                      Mandatory (cannot be avoided)
                    </Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { resetForm(); setShowAdd(false); setEditId(null); }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={editId ? handleUpdate : handleCreate}
                      disabled={!form.name.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {editId ? "Update" : "Create"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events List */}
        {events.length === 0 && !showAdd ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No IP threshold events defined</p>
            <p className="text-xs mt-1">Create events that trigger at specific relationship levels</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const typeConfig = EVENT_TYPE_CONFIG[event.event_type];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-muted ${typeConfig.color}`}>
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.threshold_min} to {event.threshold_max}
                      </Badge>
                      {event.is_mandatory && (
                        <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {event.description || typeConfig.label}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
