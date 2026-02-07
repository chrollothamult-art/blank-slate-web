import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitMerge, Plus, Trash2, Flag, Route, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useConvergence,
  EntryPoint,
  ConvergenceNode,
  ConvergenceType,
  ConvergenceResult,
  CONVERGENCE_TYPE_LABELS,
  RESULT_LABELS,
} from "@/hooks/useConvergence";

interface ConvergenceEditorProps {
  campaignId: string;
  storyNodes?: Array<{ id: string; node_type: string }>;
}

export const ConvergenceEditor = ({ campaignId, storyNodes = [] }: ConvergenceEditorProps) => {
  const {
    entryPoints,
    convergenceNodes,
    loading,
    fetchAll,
    createEntryPoint,
    updateEntryPoint,
    deleteEntryPoint,
    createConvergenceNode,
    deleteConvergenceNode,
    createRule,
    deleteRule,
  } = useConvergence(campaignId);

  const [isCreateEntryOpen, setIsCreateEntryOpen] = useState(false);
  const [isCreateConvergenceOpen, setIsCreateConvergenceOpen] = useState(false);
  const [expandedConvergence, setExpandedConvergence] = useState<string | null>(null);
  const [addingRuleFor, setAddingRuleFor] = useState<string | null>(null);

  // Entry point form
  const [entryLabel, setEntryLabel] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryMaxPlayers, setEntryMaxPlayers] = useState(1);

  // Convergence form
  const [convergenceName, setConvergenceName] = useState("");
  const [convergenceType, setConvergenceType] = useState<ConvergenceType>("merge");
  const [convergenceDescription, setConvergenceDescription] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEntryPoints, setSelectedEntryPoints] = useState<string[]>([]);

  // Rule form
  const [ruleConditionType, setRuleConditionType] = useState("faction");
  const [ruleResult, setRuleResult] = useState<ConvergenceResult>("neutral");
  const [ruleNarrative, setRuleNarrative] = useState("");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetEntryForm = () => {
    setEntryLabel("");
    setEntryDescription("");
    setEntryMaxPlayers(1);
  };

  const resetConvergenceForm = () => {
    setConvergenceName("");
    setConvergenceType("merge");
    setConvergenceDescription("");
    setSelectedNodeId("");
    setSelectedEntryPoints([]);
  };

  const resetRuleForm = () => {
    setRuleConditionType("faction");
    setRuleResult("neutral");
    setRuleNarrative("");
  };

  const handleCreateEntry = async () => {
    if (!entryLabel.trim()) return;

    await createEntryPoint(entryLabel, {
      description: entryDescription,
      max_players: entryMaxPlayers,
    });

    resetEntryForm();
    setIsCreateEntryOpen(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm("Delete this entry point?")) {
      await deleteEntryPoint(id);
    }
  };

  const handleCreateConvergence = async () => {
    if (!convergenceName.trim() || !selectedNodeId) return;

    await createConvergenceNode(selectedNodeId, convergenceName, convergenceType, {
      required_entry_points: selectedEntryPoints,
      description: convergenceDescription,
    });

    resetConvergenceForm();
    setIsCreateConvergenceOpen(false);
  };

  const handleDeleteConvergence = async (id: string) => {
    if (confirm("Delete this convergence node?")) {
      await deleteConvergenceNode(id);
    }
  };

  const handleAddRule = async (convergenceId: string) => {
    const conditions: Record<string, unknown> = {};
    if (ruleConditionType === "faction") {
      conditions.faction_match = true;
    } else if (ruleConditionType === "entry_point") {
      conditions.entry_points = selectedEntryPoints;
    }

    await createRule(convergenceId, ruleConditionType, conditions, ruleResult, {
      result_narrative: ruleNarrative,
    });

    resetRuleForm();
    setAddingRuleFor(null);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm("Delete this rule?")) {
      await deleteRule(ruleId);
    }
  };

  const toggleEntryPointSelection = (id: string) => {
    setSelectedEntryPoints((prev) =>
      prev.includes(id) ? prev.filter((ep) => ep !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading convergence system...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-primary" />
          Multiplayer Convergence
        </CardTitle>
        <CardDescription>
          Create multiple starting paths that merge into allies or enemies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="entry-points" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entry-points">Entry Points</TabsTrigger>
            <TabsTrigger value="convergence">Convergence Nodes</TabsTrigger>
          </TabsList>

          {/* Entry Points Tab */}
          <TabsContent value="entry-points" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateEntryOpen} onOpenChange={setIsCreateEntryOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Entry Point
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Entry Point</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Entry Label</Label>
                      <Input
                        value={entryLabel}
                        onChange={(e) => setEntryLabel(e.target.value)}
                        placeholder="The Rebel Path"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={entryDescription}
                        onChange={(e) => setEntryDescription(e.target.value)}
                        placeholder="Begin as a freedom fighter seeking justice..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Max Players</Label>
                      <Input
                        type="number"
                        value={entryMaxPlayers}
                        onChange={(e) => setEntryMaxPlayers(parseInt(e.target.value) || 1)}
                        min={1}
                        max={10}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateEntryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEntry} disabled={!entryLabel.trim()}>
                      Create Entry Point
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {entryPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No entry points yet</p>
                <p className="text-sm">Create multiple starting paths for players</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence>
                  {entryPoints.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Route className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">{entry.entry_label}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {entry.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Max {entry.max_players} player{entry.max_players > 1 ? "s" : ""}
                        </Badge>
                        {!entry.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Convergence Nodes Tab */}
          <TabsContent value="convergence" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateConvergenceOpen} onOpenChange={setIsCreateConvergenceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={storyNodes.length === 0}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Convergence
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Convergence Node</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={convergenceName}
                        onChange={(e) => setConvergenceName(e.target.value)}
                        placeholder="The Crossroads"
                      />
                    </div>
                    <div>
                      <Label>Story Node</Label>
                      <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a node..." />
                        </SelectTrigger>
                        <SelectContent>
                          {storyNodes.map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.node_type} - {node.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Convergence Type</Label>
                      <Select
                        value={convergenceType}
                        onValueChange={(v) => setConvergenceType(v as ConvergenceType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONVERGENCE_TYPE_LABELS).map(([key, { label, icon, description }]) => (
                            <SelectItem key={key} value={key}>
                              {icon} {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Required Entry Points</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entryPoints.map((ep) => (
                          <Badge
                            key={ep.id}
                            variant={selectedEntryPoints.includes(ep.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleEntryPointSelection(ep.id)}
                          >
                            {ep.entry_label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={convergenceDescription}
                        onChange={(e) => setConvergenceDescription(e.target.value)}
                        placeholder="Where the paths finally cross..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateConvergenceOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateConvergence}
                      disabled={!convergenceName.trim() || !selectedNodeId}
                    >
                      Create Convergence
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {convergenceNodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitMerge className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No convergence nodes yet</p>
                <p className="text-sm">Define where player paths merge</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {convergenceNodes.map((node, index) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Collapsible
                        open={expandedConvergence === node.id}
                        onOpenChange={(open) => setExpandedConvergence(open ? node.id : null)}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {CONVERGENCE_TYPE_LABELS[node.convergence_type].icon}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{node.name}</p>
                                    <Badge variant="outline">
                                      {CONVERGENCE_TYPE_LABELS[node.convergence_type].label}
                                    </Badge>
                                    <Badge variant="secondary">
                                      {node.rules?.length || 0} rules
                                    </Badge>
                                  </div>
                                  {node.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {node.description}
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
                                    handleDeleteConvergence(node.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                {expandedConvergence === node.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t p-4 bg-muted/10 space-y-4">
                              {/* Required entry points */}
                              {node.required_entry_points.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Required Entry Points:</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {node.required_entry_points.map((epId) => {
                                      const ep = entryPoints.find((e) => e.id === epId);
                                      return (
                                        <Badge key={epId} variant="secondary">
                                          {ep?.entry_label || epId.slice(0, 8)}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Rules */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium">Alliance/Enemy Rules:</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAddingRuleFor(node.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Rule
                                  </Button>
                                </div>

                                {node.rules && node.rules.length > 0 ? (
                                  <div className="space-y-2">
                                    {node.rules.map((rule) => (
                                      <div
                                        key={rule.id}
                                        className={`flex items-start justify-between p-3 rounded-lg border ${
                                          rule.result === "ally"
                                            ? "border-green-500/30 bg-green-500/5"
                                            : rule.result === "enemy"
                                            ? "border-red-500/30 bg-red-500/5"
                                            : "border-border"
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span>{RESULT_LABELS[rule.result].icon}</span>
                                            <Badge
                                              variant="outline"
                                              className={RESULT_LABELS[rule.result].color}
                                            >
                                              {RESULT_LABELS[rule.result].label}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              if {rule.condition_type}
                                            </span>
                                          </div>
                                          {rule.result_narrative && (
                                            <p className="text-sm">{rule.result_narrative}</p>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => handleDeleteRule(rule.id)}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No rules defined yet
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
          </TabsContent>
        </Tabs>

        {/* Add Rule Dialog */}
        <Dialog open={!!addingRuleFor} onOpenChange={(open) => !open && setAddingRuleFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Convergence Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Condition Type</Label>
                  <Select value={ruleConditionType} onValueChange={setRuleConditionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faction">Same Faction</SelectItem>
                      <SelectItem value="flag">Story Flag</SelectItem>
                      <SelectItem value="entry_point">Entry Point Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Result</Label>
                  <Select
                    value={ruleResult}
                    onValueChange={(v) => setRuleResult(v as ConvergenceResult)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ally">🛡️ Allied</SelectItem>
                      <SelectItem value="enemy">⚔️ Enemies</SelectItem>
                      <SelectItem value="neutral">➖ Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Result Narrative</Label>
                <Textarea
                  value={ruleNarrative}
                  onChange={(e) => setRuleNarrative(e.target.value)}
                  placeholder="You recognize each other as fellow rebels..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingRuleFor(null)}>
                Cancel
              </Button>
              <Button onClick={() => addingRuleFor && handleAddRule(addingRuleFor)}>
                Add Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ConvergenceEditor;
