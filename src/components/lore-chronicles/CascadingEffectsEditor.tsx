import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Trash2, ArrowRight, Lock, Unlock, Gauge, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCascadingEffects, CascadeRule } from "@/hooks/useCascadingEffects";

interface CascadingEffectsEditorProps {
  campaignId: string;
}

const EFFECT_TYPE_CONFIG = {
  unlock: { label: "Unlock", icon: Unlock, color: "text-green-500" },
  lock: { label: "Lock", icon: Lock, color: "text-red-500" },
  modify_difficulty: { label: "Modify Difficulty", icon: Gauge, color: "text-yellow-500" },
  change_outcome: { label: "Change Outcome", icon: RefreshCw, color: "text-blue-500" },
};

const OUTCOME_TYPES = [
  { value: "good", label: "Success" },
  { value: "bad", label: "Failure" },
  { value: "neutral", label: "Neutral" },
];

export const CascadingEffectsEditor = ({ campaignId }: CascadingEffectsEditorProps) => {
  const {
    cascadeRules,
    loading,
    fetchCascadeRules,
    createCascadeRule,
    deleteCascadeRule,
  } = useCascadingEffects(campaignId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [sourceOutcome, setSourceOutcome] = useState<"good" | "bad" | "neutral">("good");
  const [targetId, setTargetId] = useState("");
  const [effectType, setEffectType] = useState<CascadeRule["effect_type"]>("unlock");
  const [difficultyMod, setDifficultyMod] = useState(0);
  const [forcedOutcome, setForcedOutcome] = useState("");

  useEffect(() => {
    fetchCascadeRules();
  }, [fetchCascadeRules]);

  const handleCreate = async () => {
    if (!sourceId.trim() || !targetId.trim()) return;

    const effectValue: Record<string, unknown> = {};
    if (effectType === "modify_difficulty") effectValue.modifier = difficultyMod;
    if (effectType === "change_outcome") effectValue.force_outcome = forcedOutcome;

    await createCascadeRule(sourceId, sourceOutcome, targetId, effectType, effectValue);
    resetForm();
    setIsCreateOpen(false);
  };

  const resetForm = () => {
    setSourceId("");
    setSourceOutcome("good");
    setTargetId("");
    setEffectType("unlock");
    setDifficultyMod(0);
    setForcedOutcome("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this cascade rule?")) {
      await deleteCascadeRule(id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading cascading effects...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Cascading Effects
        </CardTitle>
        <CardDescription>
          Define how one interaction's outcome affects future interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Cascade Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Cascade Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Source Interaction ID</Label>
                  <Input
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    placeholder="interaction_node_id"
                  />
                </div>
                <div>
                  <Label>When Outcome Is</Label>
                  <Select value={sourceOutcome} onValueChange={(v) => setSourceOutcome(v as "good" | "bad" | "neutral")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OUTCOME_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Interaction ID</Label>
                  <Input
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="target_interaction_node_id"
                  />
                </div>
                <div>
                  <Label>Effect Type</Label>
                  <Select value={effectType} onValueChange={(v) => setEffectType(v as CascadeRule["effect_type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(EFFECT_TYPE_CONFIG).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {effectType === "modify_difficulty" && (
                  <div>
                    <Label>Difficulty Modifier</Label>
                    <Input
                      type="number"
                      value={difficultyMod}
                      onChange={(e) => setDifficultyMod(parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
                {effectType === "change_outcome" && (
                  <div>
                    <Label>Force Outcome</Label>
                    <Select value={forcedOutcome} onValueChange={setForcedOutcome}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {OUTCOME_TYPES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!sourceId.trim() || !targetId.trim()}>
                  Create Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {cascadeRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No cascade rules yet</p>
            <p className="text-sm">Create rules to link interaction outcomes</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {cascadeRules.map((rule, index) => {
                const config = EFFECT_TYPE_CONFIG[rule.effect_type];
                const EffectIcon = config.icon;

                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline">{rule.source_interaction_id.slice(0, 8)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          on {rule.source_outcome_type}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <EffectIcon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{rule.target_interaction_id.slice(0, 8)}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
