import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GitFork, Plus, ArrowRight, Trash2, Edit, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCampaignForks, CampaignFork } from "@/hooks/useCampaignForks";
import { useLoreChronicles, RpCampaign, RpStoryNode } from "@/hooks/useLoreChronicles";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  campaignId: string;
}

export const CrossoverManager = ({ campaignId }: Props) => {
  const { user } = useAuth();
  const { forks, incomingForks, loading, createFork, deleteFork, fetchOutgoingForks, fetchIncomingForks } = useCampaignForks(campaignId);
  const { campaigns } = useLoreChronicles();
  const [nodes, setNodes] = useState<RpStoryNode[]>([]);
  const [targetNodes, setTargetNodes] = useState<RpStoryNode[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCampaignId, setTargetCampaignId] = useState("");
  const [forkNodeId, setForkNodeId] = useState("");
  const [entryNodeId, setEntryNodeId] = useState("");

  // Fetch nodes for this campaign
  useEffect(() => {
    const fetchNodes = async () => {
      const { data } = await supabase
        .from("rp_story_nodes")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at");
      
      if (data) {
        setNodes(data.map(n => ({
          ...n,
          content: n.content as RpStoryNode["content"]
        })));
      }
    };

    fetchNodes();
    fetchOutgoingForks();
    fetchIncomingForks();
  }, [campaignId, fetchOutgoingForks, fetchIncomingForks]);

  // Fetch target campaign nodes when selected
  useEffect(() => {
    const fetchTargetNodes = async () => {
      if (!targetCampaignId) {
        setTargetNodes([]);
        return;
      }

      const { data } = await supabase
        .from("rp_story_nodes")
        .select("*")
        .eq("campaign_id", targetCampaignId)
        .order("created_at");
      
      if (data) {
        setTargetNodes(data.map(n => ({
          ...n,
          content: n.content as RpStoryNode["content"]
        })));
      }
    };

    fetchTargetNodes();
  }, [targetCampaignId]);

  // Filter out current campaign and only show published ones
  const availableCampaigns = campaigns.filter(c => c.id !== campaignId && c.is_published);

  const handleCreate = async () => {
    if (!title || !targetCampaignId) return;

    setCreating(true);
    await createFork({
      source_campaign_id: campaignId,
      target_campaign_id: targetCampaignId,
      fork_node_id: forkNodeId || undefined,
      entry_node_id: entryNodeId || undefined,
      title,
      description
    });
    setCreating(false);
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetCampaignId("");
    setForkNodeId("");
    setEntryNodeId("");
  };

  if (loading) {
    return <Card className="animate-pulse"><CardContent className="h-48" /></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" />
            <CardTitle>Story Crossovers</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Crossover
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Story Crossover</DialogTitle>
                <DialogDescription>
                  Link your campaign to another, allowing players to travel between stories
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Crossover Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Portal to the Shadow Realm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target Campaign *</Label>
                  <Select value={targetCampaignId} onValueChange={setTargetCampaignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCampaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forkNode">Fork From Node (optional)</Label>
                  <Select value={forkNodeId} onValueChange={setForkNodeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any node (player chooses)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any node</SelectItem>
                      {nodes.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.title || n.content.text?.slice(0, 30) || n.node_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Where in your story does the crossover appear?
                  </p>
                </div>

                {targetCampaignId && (
                  <div className="space-y-2">
                    <Label htmlFor="entryNode">Entry Point (optional)</Label>
                    <Select value={entryNodeId} onValueChange={setEntryNodeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Start node of target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Default start</SelectItem>
                        {targetNodes.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.title || n.content.text?.slice(0, 30) || n.node_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Where do players enter the target campaign?
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What happens when players take this crossover?"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating || !title || !targetCampaignId}>
                  {creating ? "Creating..." : "Create Crossover"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Connect your campaign to others for intertwined storylines
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Outgoing Crossovers */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            Outgoing Crossovers
          </h4>
          
          {forks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No outgoing crossovers. Add one to let players explore other campaigns!
            </p>
          ) : (
            <div className="space-y-3">
              {forks.map((fork) => (
                <motion.div
                  key={fork.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{fork.title}</p>
                      <p className="text-sm text-muted-foreground">
                        → {fork.target_campaign?.title || "Unknown Campaign"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteFork(fork.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Crossovers */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary rotate-180" />
            Incoming Crossovers
          </h4>
          
          {incomingForks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaigns link to this one yet.
            </p>
          ) : (
            <div className="space-y-3">
              {incomingForks.map((fork) => (
                <div
                  key={fork.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{fork.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ← {fork.source_campaign?.title || "Unknown Campaign"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
