import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Plus, Trash2, Compass, Swords, MessageCircle,
  Search, AlertTriangle, Ghost, Link2, Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHints, HintType, SourceFlavor } from "@/hooks/useHints";

interface HintDesignerProps {
  campaignId: string;
}

const HINT_TYPE_CONFIG: Record<HintType, { label: string; icon: React.ReactNode; color: string }> = {
  direction: { label: "Direction", icon: <Compass className="h-4 w-4" />, color: "text-blue-500" },
  action: { label: "Action", icon: <Swords className="h-4 w-4" />, color: "text-red-500" },
  social: { label: "Social", icon: <MessageCircle className="h-4 w-4" />, color: "text-green-500" },
  discovery: { label: "Discovery", icon: <Search className="h-4 w-4" />, color: "text-yellow-500" },
  warning: { label: "Warning", icon: <AlertTriangle className="h-4 w-4" />, color: "text-orange-500" },
};

const SOURCE_FLAVORS: { value: SourceFlavor; label: string }[] = [
  { value: "inner_voice", label: "Inner Voice" },
  { value: "companion_whisper", label: "Companion Whisper" },
  { value: "environmental_clue", label: "Environmental Clue" },
  { value: "divine_sign", label: "Divine Sign" },
];

export const HintDesigner = ({ campaignId }: HintDesignerProps) => {
  const {
    hints,
    hintChains,
    loading,
    fetchHints,
    fetchHintChains,
    createHint,
    deleteHint,
    createHintChain,
    deleteHintChain,
  } = useHints(campaignId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isChainOpen, setIsChainOpen] = useState(false);

  // Hint form state
  const [hintType, setHintType] = useState<HintType>("direction");
  const [hintText, setHintText] = useState("");
  const [sourceFlavor, setSourceFlavor] = useState<SourceFlavor>("inner_voice");
  const [isRedHerring, setIsRedHerring] = useState(false);
  const [nodeId, setNodeId] = useState("");
  const [priority, setPriority] = useState(0);
  const [followOutcome, setFollowOutcome] = useState("");
  const [ignoreOutcome, setIgnoreOutcome] = useState("");
  const [oppositeOutcome, setOppositeOutcome] = useState("");

  // Chain form state
  const [chainName, setChainName] = useState("");
  const [selectedHintIds, setSelectedHintIds] = useState<string[]>([]);

  useEffect(() => {
    fetchHints();
    fetchHintChains();
  }, [fetchHints, fetchHintChains]);

  const handleCreateHint = async () => {
    if (!hintText.trim()) return;

    await createHint({
      node_id: nodeId || undefined,
      hint_type: hintType,
      hint_text: hintText,
      source_flavor: sourceFlavor,
      is_red_herring: isRedHerring,
      priority,
      follow_outcome: followOutcome ? { description: followOutcome } : {},
      ignore_outcome: ignoreOutcome ? { description: ignoreOutcome } : {},
      opposite_outcome: oppositeOutcome ? { description: oppositeOutcome } : {},
    });

    resetForm();
    setIsCreateOpen(false);
  };

  const resetForm = () => {
    setHintType("direction");
    setHintText("");
    setSourceFlavor("inner_voice");
    setIsRedHerring(false);
    setNodeId("");
    setPriority(0);
    setFollowOutcome("");
    setIgnoreOutcome("");
    setOppositeOutcome("");
  };

  const handleCreateChain = async () => {
    if (!chainName.trim() || selectedHintIds.length < 2) return;
    await createHintChain(chainName, selectedHintIds);
    setChainName("");
    setSelectedHintIds([]);
    setIsChainOpen(false);
  };

  const toggleHintInChain = (hintId: string) => {
    setSelectedHintIds((prev) =>
      prev.includes(hintId) ? prev.filter((id) => id !== hintId) : [...prev, hintId]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading hints...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Hint & Suggestion Designer
        </CardTitle>
        <CardDescription>
          Create context-aware hints that nudge players — their responses affect the story
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="hints">
          <TabsList>
            <TabsTrigger value="hints">Hints ({hints.length})</TabsTrigger>
            <TabsTrigger value="chains">Chains ({hintChains.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="hints" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Hint
              </Button>
            </div>

            {hints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hints yet</p>
                <p className="text-sm">Create hints to guide your players</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {hints.map((hint, index) => {
                    const config = HINT_TYPE_CONFIG[hint.hint_type];
                    return (
                      <motion.div
                        key={hint.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="border rounded-lg p-4 bg-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={config.color}>{config.icon}</span>
                              <Badge variant="outline">{config.label}</Badge>
                              {hint.is_red_herring && (
                                <Badge variant="destructive" className="text-xs">
                                  <Ghost className="h-3 w-3 mr-1" />
                                  Red Herring
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {SOURCE_FLAVORS.find((f) => f.value === hint.source_flavor)?.label}
                              </Badge>
                            </div>
                            <p className="text-sm italic text-muted-foreground">
                              "{hint.hint_text}"
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => {
                              if (confirm("Delete this hint?")) deleteHint(hint.id);
                            }}
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
          </TabsContent>

          <TabsContent value="chains" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsChainOpen(true)} disabled={hints.length < 2}>
                <Link2 className="h-4 w-4 mr-1" />
                Create Chain
              </Button>
            </div>

            {hintChains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hint chains yet</p>
                <p className="text-sm">Chain hints together for multi-step revelations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hintChains.map((chain) => (
                  <div key={chain.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{chain.chain_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {chain.hint_ids.length} hints in sequence
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          if (confirm("Delete this chain?")) deleteHintChain(chain.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Hint Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Hint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Hint Type</Label>
                <Select value={hintType} onValueChange={(v) => setHintType(v as HintType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(HINT_TYPE_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hint Text</Label>
                <Textarea
                  value={hintText}
                  onChange={(e) => setHintText(e.target.value)}
                  placeholder="The shadows whisper of danger ahead..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Source Flavor</Label>
                <Select value={sourceFlavor} onValueChange={(v) => setSourceFlavor(v as SourceFlavor)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_FLAVORS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Node ID (optional — leave blank for global)</Label>
                <Input value={nodeId} onChange={(e) => setNodeId(e.target.value)} placeholder="node_uuid" />
              </div>
              <div>
                <Label>Priority (higher = shown first)</Label>
                <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isRedHerring} onCheckedChange={setIsRedHerring} />
                <Label>Red Herring (misleading hint)</Label>
              </div>
              <div>
                <Label>Follow Outcome</Label>
                <Input value={followOutcome} onChange={(e) => setFollowOutcome(e.target.value)} placeholder="Player gains +5 XP" />
              </div>
              <div>
                <Label>Ignore Outcome</Label>
                <Input value={ignoreOutcome} onChange={(e) => setIgnoreOutcome(e.target.value)} placeholder="60% chance ambush fires" />
              </div>
              <div>
                <Label>Opposite Action Outcome</Label>
                <Input value={oppositeOutcome} onChange={(e) => setOppositeOutcome(e.target.value)} placeholder="Triggers Reckless Bravery event" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateHint} disabled={!hintText.trim()}>Create Hint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Chain Dialog */}
        <Dialog open={isChainOpen} onOpenChange={setIsChainOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Hint Chain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Chain Name</Label>
                <Input value={chainName} onChange={(e) => setChainName(e.target.value)} placeholder="The Elder's Trail" />
              </div>
              <div>
                <Label>Select Hints (in order)</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {hints.map((hint) => (
                    <label key={hint.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={selectedHintIds.includes(hint.id)}
                        onChange={() => toggleHintInChain(hint.id)}
                      />
                      <span className="text-sm truncate">
                        [{HINT_TYPE_CONFIG[hint.hint_type].label}] {hint.hint_text.slice(0, 50)}...
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChainOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateChain} disabled={!chainName.trim() || selectedHintIds.length < 2}>
                <Sparkles className="h-4 w-4 mr-1" />
                Create Chain
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
