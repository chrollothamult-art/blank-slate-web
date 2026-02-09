import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Plus, Save, Play, Trash2, Link2, 
  BookOpen, MessageSquare, GitBranch, CheckCircle,
  Settings, Eye, EyeOff, Flag, Zap, Dice1, Users, GitMerge, Shield, Lightbulb, Globe, Bot, MessageSquarePlus, Skull, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { RpCampaign, RpStoryNode, RpNodeChoice } from "@/hooks/useLoreChronicles";
import { useAIConfig } from "@/hooks/useAIConfig";
import { KeyPointsEditor } from "@/components/lore-chronicles/KeyPointsEditor";
import { EventTriggersEditor } from "@/components/lore-chronicles/EventTriggersEditor";
import { RandomEventsEditor } from "@/components/lore-chronicles/RandomEventsEditor";
import { InteractionPointsEditor } from "@/components/lore-chronicles/InteractionPointsEditor";
import { ConvergenceEditor } from "@/components/lore-chronicles/ConvergenceEditor";
import { CampaignFactionsEditor } from "@/components/lore-chronicles/CampaignFactionsEditor";
import { HintDesigner } from "@/components/lore-chronicles/HintDesigner";
import { WorldBuilder } from "@/components/lore-chronicles/WorldBuilder";
import { AIDMConfigPanel } from "@/components/lore-chronicles/AIDMConfigPanel";
import { CampaignImageUpload } from "@/components/lore-chronicles/CampaignImageUpload";
 
 interface NodeWithChoices extends RpStoryNode {
   choices: RpNodeChoice[];
 }
 
 const nodeTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
   narrative: { label: "Narrative", icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-500" },
   choice: { label: "Choice", icon: <GitBranch className="h-4 w-4" />, color: "bg-purple-500" },
   stat_check: { label: "Stat Check", icon: <MessageSquare className="h-4 w-4" />, color: "bg-orange-500" },
   ending: { label: "Ending", icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-500" }
 };
 
 const CampaignEditor = () => {
   const { campaignId } = useParams<{ campaignId: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   
   const [campaign, setCampaign] = useState<RpCampaign | null>(null);
   const [nodes, setNodes] = useState<NodeWithChoices[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   
   const [editingNode, setEditingNode] = useState<NodeWithChoices | null>(null);
   const [showNodeDialog, setShowNodeDialog] = useState(false);
   const [showSettingsDialog, setShowSettingsDialog] = useState(false);
 
   // Fetch campaign and nodes
   const fetchData = useCallback(async () => {
     if (!campaignId) return;
 
     const { data: campaignData, error: campaignError } = await supabase
       .from("rp_campaigns")
       .select("*")
       .eq("id", campaignId)
       .single();
 
     if (campaignError || !campaignData) {
       toast({ title: "Campaign not found", variant: "destructive" });
       navigate('/lore-chronicles');
       return;
     }
 
     // Check ownership
     if (campaignData.author_id !== user?.id) {
       toast({ title: "Access denied", variant: "destructive" });
       navigate('/lore-chronicles');
       return;
     }
 
     setCampaign(campaignData as RpCampaign);
 
     // Fetch nodes with choices
     const { data: nodesData } = await supabase
       .from("rp_story_nodes")
       .select("*")
       .eq("campaign_id", campaignId)
       .order("created_at");
 
     const nodesWithChoices: NodeWithChoices[] = [];
     
   for (const node of (nodesData || [])) {
       const { data: choices } = await supabase
         .from("rp_node_choices")
         .select("*")
         .eq("node_id", node.id)
         .order("order_index");
 
       nodesWithChoices.push({
         ...node,
         content: node.content as RpStoryNode["content"],
         choices: (choices || []).map(c => ({
           ...c,
           stat_requirement: c.stat_requirement as RpNodeChoice["stat_requirement"],
           stat_effect: c.stat_effect as RpNodeChoice["stat_effect"]
         }))
       });
     }
 
     setNodes(nodesWithChoices);
     setLoading(false);
   }, [campaignId, user?.id, navigate]);
 
   useEffect(() => {
     fetchData();
   }, [fetchData]);
 
   // Create new node
   const createNode = async (nodeType: string) => {
     if (!campaignId) return;
 
     const { data, error } = await supabase
       .from("rp_story_nodes")
       .insert({
         campaign_id: campaignId,
         node_type: nodeType,
         title: `New ${nodeTypeLabels[nodeType]?.label || "Node"}`,
         content: { text: "Enter your story text here..." },
         position_x: nodes.length * 50,
         position_y: 100,
         xp_reward: nodeType === "ending" ? 100 : 10
       })
       .select()
       .single();
 
     if (error) {
       toast({ title: "Failed to create node", variant: "destructive" });
       return;
     }
 
     const newNode: NodeWithChoices = {
       ...data,
       content: data.content as RpStoryNode["content"],
       choices: []
     };
 
     setNodes([...nodes, newNode]);
 
     // If this is the first node, set it as start node
     if (nodes.length === 0) {
       await supabase
         .from("rp_campaigns")
         .update({ start_node_id: data.id })
         .eq("id", campaignId);
       
       setCampaign(prev => prev ? { ...prev, start_node_id: data.id } : null);
     }
 
     toast({ title: "Node created!" });
   };
 
   // Save node
   const saveNode = async (node: NodeWithChoices) => {
     setSaving(true);
 
    const { error: nodeError } = await supabase
        .from("rp_story_nodes")
        .update({
          title: node.title,
          content: node.content,
          node_type: node.node_type,
          image_url: node.image_url,
          xp_reward: node.xp_reward,
          allows_free_text: node.allows_free_text,
          free_text_prompt: node.free_text_prompt
        })
        .eq("id", node.id);
 
     if (nodeError) {
       toast({ title: "Failed to save node", variant: "destructive" });
       setSaving(false);
       return;
     }
 
     // Update choices - delete existing and recreate
     await supabase.from("rp_node_choices").delete().eq("node_id", node.id);
 
     if (node.choices.length > 0) {
       for (const c of node.choices) {
         await supabase.from("rp_node_choices").insert({
           node_id: node.id,
           choice_text: c.choice_text,
           target_node_id: c.target_node_id || undefined,
           stat_requirement: c.stat_requirement ? JSON.parse(JSON.stringify(c.stat_requirement)) : null,
           stat_effect: c.stat_effect ? JSON.parse(JSON.stringify(c.stat_effect)) : null,
           order_index: node.choices.indexOf(c)
         });
       }
     }
 
     setNodes(nodes.map(n => n.id === node.id ? node : n));
     setShowNodeDialog(false);
     setEditingNode(null);
     setSaving(false);
     toast({ title: "Node saved!" });
   };
 
   // Delete node
   const deleteNode = async (nodeId: string) => {
     await supabase.from("rp_node_choices").delete().eq("node_id", nodeId);
     await supabase.from("rp_story_nodes").delete().eq("id", nodeId);
     
     setNodes(nodes.filter(n => n.id !== nodeId));
     setShowNodeDialog(false);
     setEditingNode(null);
     toast({ title: "Node deleted" });
   };
 
   // Toggle publish
   const togglePublish = async () => {
     if (!campaign) return;
 
     const newStatus = !campaign.is_published;
     
     if (newStatus && nodes.length === 0) {
       toast({ title: "Add at least one node before publishing", variant: "destructive" });
       return;
     }
 
     await supabase
       .from("rp_campaigns")
       .update({ is_published: newStatus })
       .eq("id", campaign.id);
 
     setCampaign({ ...campaign, is_published: newStatus });
     toast({ title: newStatus ? "Campaign published!" : "Campaign unpublished" });
   };
 
   // Set start node
   const setStartNode = async (nodeId: string) => {
     if (!campaign) return;
 
     await supabase
       .from("rp_campaigns")
       .update({ start_node_id: nodeId })
       .eq("id", campaign.id);
 
     setCampaign({ ...campaign, start_node_id: nodeId });
     toast({ title: "Start node updated" });
   };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-pulse text-center">
           <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
           <p className="text-muted-foreground">Loading campaign editor...</p>
         </div>
       </div>
     );
   }
 
   if (!campaign) return null;
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
         <div className="container mx-auto px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <h1 className="font-semibold">{campaign.title}</h1>
               <p className="text-sm text-muted-foreground">
                 {nodes.length} nodes · {campaign.genre}
               </p>
             </div>
           </div>
 
           <div className="flex items-center gap-2">
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => setShowSettingsDialog(true)}
             >
               <Settings className="h-4 w-4 mr-2" />
               Settings
             </Button>
             <Button 
               variant={campaign.is_published ? "secondary" : "default"}
               size="sm"
               onClick={togglePublish}
             >
               {campaign.is_published ? (
                 <>
                   <EyeOff className="h-4 w-4 mr-2" />
                   Unpublish
                 </>
               ) : (
                 <>
                   <Eye className="h-4 w-4 mr-2" />
                   Publish
                 </>
               )}
             </Button>
           </div>
         </div>
       </header>
 
       {/* Main Content */}
       <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="nodes" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="nodes" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Nodes
              </TabsTrigger>
              <TabsTrigger value="key-points" className="gap-2">
                <Flag className="h-4 w-4" />
                Key Points
              </TabsTrigger>
              <TabsTrigger value="triggers" className="gap-2">
                <Zap className="h-4 w-4" />
                Triggers
              </TabsTrigger>
              <TabsTrigger value="random-events" className="gap-2">
                <Dice1 className="h-4 w-4" />
                Random Events
              </TabsTrigger>
              <TabsTrigger value="interactions" className="gap-2">
                <Users className="h-4 w-4" />
                Interactions
              </TabsTrigger>
              <TabsTrigger value="convergence" className="gap-2">
                <GitMerge className="h-4 w-4" />
                Convergence
              </TabsTrigger>
              <TabsTrigger value="factions" className="gap-2">
                <Shield className="h-4 w-4" />
                Factions
              </TabsTrigger>
               <TabsTrigger value="hints" className="gap-2">
                 <Lightbulb className="h-4 w-4" />
                 Hints
               </TabsTrigger>
               <TabsTrigger value="world-builder" className="gap-2">
                  <Globe className="h-4 w-4" />
                  World Builder
                </TabsTrigger>
                <TabsTrigger value="ai-dm" className="gap-2">
                  <Bot className="h-4 w-4" />
                  AI DM
                </TabsTrigger>
              </TabsList>

            <TabsContent value="nodes">
             {/* Add Node Buttons */}
             <div className="flex flex-wrap gap-2 mb-8">
               <span className="text-sm text-muted-foreground self-center mr-2">Add Node:</span>
               {Object.entries(nodeTypeLabels).map(([type, { label, icon, color }]) => (
                 <Button
                   key={type}
                   variant="outline"
                   size="sm"
                   onClick={() => createNode(type)}
                   className="gap-2"
                 >
                   <span className={`w-2 h-2 rounded-full ${color}`} />
                   {icon}
                   {label}
                 </Button>
               ))}
             </div>

             {/* Nodes Grid */}
             {nodes.length === 0 ? (
               <Card className="text-center py-12">
                 <CardContent>
                   <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                   <h3 className="text-xl font-semibold mb-2">No Nodes Yet</h3>
                   <p className="text-muted-foreground mb-4">
                     Start building your story by adding a narrative node
                   </p>
                   <Button onClick={() => createNode("narrative")}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add First Node
                   </Button>
                 </CardContent>
               </Card>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {nodes.map((node, index) => {
                   const typeInfo = nodeTypeLabels[node.node_type] || nodeTypeLabels.narrative;
                   const isStart = campaign.start_node_id === node.id;

                   return (
                     <motion.div
                       key={node.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05 }}
                     >
                       <Card 
                          className={`cursor-pointer hover:border-primary/40 transition-colors ${
                            isStart ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => {
                            setEditingNode(node);
                            setShowNodeDialog(true);
                          }}
                        >
                          {/* Node Thumbnail */}
                          {node.image_url && (
                            <div className="h-28 overflow-hidden rounded-t-xl">
                              <img
                                src={node.image_url}
                                alt={node.title || "Node"}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${typeInfo.color}`} />
                                <Badge variant="outline" className="text-xs">
                                  {typeInfo.label}
                                </Badge>
                              </div>
                              {isStart && (
                                <Badge className="bg-primary">Start</Badge>
                              )}
                            </div>
                            <CardTitle className="text-base mt-2">
                              {node.title || "Untitled Node"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {node.content.text || "No content"}
                            </p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <GitBranch className="h-3 w-3" />
                              {node.choices.length} choice{node.choices.length !== 1 ? "s" : ""}
                              {node.image_url && (
                                <ImageIcon className="h-3 w-3 ml-1" />
                              )}
                              <span className="ml-auto">+{node.xp_reward} XP</span>
                            </div>
                          </CardContent>
                        </Card>
                     </motion.div>
                   );
                 })}
               </div>
             )}
           </TabsContent>

           <TabsContent value="key-points">
             <KeyPointsEditor 
               campaignId={campaignId!} 
               storyNodes={nodes.map(n => ({ id: n.id, title: n.title }))} 
             />
           </TabsContent>

            <TabsContent value="triggers">
              <EventTriggersEditor campaignId={campaignId!} />
            </TabsContent>

            <TabsContent value="random-events">
              <RandomEventsEditor campaignId={campaignId!} />
            </TabsContent>

            <TabsContent value="interactions">
              <InteractionPointsEditor campaignId={campaignId!} />
            </TabsContent>

            <TabsContent value="convergence">
              <ConvergenceEditor 
                campaignId={campaignId!} 
                storyNodes={nodes.map(n => ({ id: n.id, node_type: n.node_type }))} 
              />
            </TabsContent>

             <TabsContent value="factions">
               <CampaignFactionsEditor campaignId={campaignId!} />
             </TabsContent>

             <TabsContent value="hints">
               <HintDesigner campaignId={campaignId!} />
              </TabsContent>

               <TabsContent value="world-builder">
                 <WorldBuilder campaignId={campaignId!} />
               </TabsContent>

               <TabsContent value="ai-dm">
                 <AIDMConfigPanel campaignId={campaignId!} />
               </TabsContent>
           </Tabs>
       </main>
 
       {/* Node Editor Dialog */}
       <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           {editingNode && (
            <NodeEditorForm
                node={editingNode}
                allNodes={nodes}
                isStartNode={campaign.start_node_id === editingNode.id}
                campaignId={campaignId!}
                onSave={saveNode}
                onDelete={() => deleteNode(editingNode.id)}
                onSetStart={() => setStartNode(editingNode.id)}
                saving={saving}
              />
           )}
         </DialogContent>
       </Dialog>
 
       {/* Campaign Settings Dialog */}
       <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Campaign Settings</DialogTitle>
             <DialogDescription>
               Configure your campaign details
             </DialogDescription>
           </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Published</p>
                  <p className="text-sm text-muted-foreground">
                    Make this campaign visible to players
                  </p>
                </div>
                <Switch
                  checked={campaign.is_published}
                  onCheckedChange={togglePublish}
                />
              </div>

              {/* Permadeath Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex items-center gap-3">
                  <Skull className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">Permadeath Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Characters are permanently deleted on death
                    </p>
                  </div>
                </div>
                <Switch
                  checked={campaign.permadeath}
                  onCheckedChange={async (checked) => {
                    await supabase
                      .from("rp_campaigns")
                      .update({ permadeath: checked })
                      .eq("id", campaign.id);
                    setCampaign({ ...campaign, permadeath: checked });
                    toast({ title: checked ? "Permadeath enabled ☠️" : "Permadeath disabled" });
                  }}
                />
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    await supabase.from("rp_campaigns").delete().eq("id", campaign.id);
                    navigate('/lore-chronicles');
                    toast({ title: "Campaign deleted" });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </Button>
              </div>
            </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
// Node Editor Form Component
const NodeEditorForm = ({
  node,
  allNodes,
  isStartNode,
  campaignId,
  onSave,
  onDelete,
  onSetStart,
  saving
}: {
  node: NodeWithChoices;
  allNodes: NodeWithChoices[];
  isStartNode: boolean;
  campaignId: string;
  onSave: (node: NodeWithChoices) => void;
  onDelete: () => void;
  onSetStart: () => void;
  saving: boolean;
}) => {
  const [editedNode, setEditedNode] = useState<NodeWithChoices>(node);
  const { config, toggleNodeNarration } = useAIConfig(campaignId);
  
  const isAINarrated = config?.ai_narration_nodes?.includes(node.id) ?? false;
 
   const updateContent = (key: string, value: string) => {
     setEditedNode({
       ...editedNode,
       content: { ...editedNode.content, [key]: value }
     });
   };
 
   const addChoice = () => {
     setEditedNode({
       ...editedNode,
       choices: [
         ...editedNode.choices,
         {
           id: crypto.randomUUID(),
           node_id: node.id,
           choice_text: "New choice",
           target_node_id: null,
           stat_requirement: null,
           stat_effect: null,
           item_requirement: null,
           item_reward: null,
           order_index: editedNode.choices.length
         }
       ]
     });
   };
 
   const updateChoice = (index: number, updates: Partial<RpNodeChoice>) => {
     const newChoices = [...editedNode.choices];
     newChoices[index] = { ...newChoices[index], ...updates };
     setEditedNode({ ...editedNode, choices: newChoices });
   };
 
   const removeChoice = (index: number) => {
     setEditedNode({
       ...editedNode,
       choices: editedNode.choices.filter((_, i) => i !== index)
     });
   };
 
   const otherNodes = allNodes.filter(n => n.id !== node.id);
 
   return (
     <>
       <DialogHeader>
         <DialogTitle>Edit Node</DialogTitle>
         <DialogDescription>
           Configure this story node and its choices
         </DialogDescription>
       </DialogHeader>
 
       <div className="space-y-4 py-4">
         {/* Node Type */}
         <div className="space-y-2">
           <Label>Node Type</Label>
           <Select
             value={editedNode.node_type}
             onValueChange={(v) => setEditedNode({ ...editedNode, node_type: v })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {Object.entries(nodeTypeLabels).map(([type, { label }]) => (
                 <SelectItem key={type} value={type}>{label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {/* Title */}
         <div className="space-y-2">
           <Label>Title</Label>
           <Input
             value={editedNode.title || ""}
             onChange={(e) => setEditedNode({ ...editedNode, title: e.target.value })}
             placeholder="Node title"
           />
         </div>
 
         {/* Story Text */}
         <div className="space-y-2">
           <Label>Story Text</Label>
           <Textarea
             value={editedNode.content.text || ""}
             onChange={(e) => updateContent("text", e.target.value)}
             rows={5}
             placeholder="The story unfolds..."
           />
          </div>

         {/* Header Image Upload */}
         <div className="space-y-2">
           <Label>Header Image</Label>
           <CampaignImageUpload
             campaignId={campaignId}
             currentUrl={editedNode.image_url}
             onUpload={(url) => setEditedNode({ ...editedNode, image_url: url })}
             onRemove={() => setEditedNode({ ...editedNode, image_url: null })}
             label="Upload scene header image"
             previewHeight="h-32"
           />
         </div>
  
          {/* NPC Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NPC Name (optional)</Label>
              <Input
                value={editedNode.content.npc_name || ""}
                onChange={(e) => updateContent("npc_name", e.target.value)}
                placeholder="Elder Sage"
              />
            </div>
            <div className="space-y-2">
              <Label>NPC Portrait URL</Label>
              <Input
                value={editedNode.content.npc_portrait || ""}
                onChange={(e) => updateContent("npc_portrait", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
 
        {/* XP Reward */}
          <div className="space-y-2">
            <Label>XP Reward</Label>
            <Input
              type="number"
              value={editedNode.xp_reward}
              onChange={(e) => setEditedNode({ ...editedNode, xp_reward: parseInt(e.target.value) || 0 })}
              min={0}
              max={1000}
            />
          </div>

          {/* AI Narration Toggle */}
          {config?.ai_enabled && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <Label className="font-medium">AI-Narrated Transition</Label>
                  <p className="text-sm text-muted-foreground">
                    AI generates narrative when entering this node
                  </p>
                </div>
              </div>
              <Switch
                checked={isAINarrated}
                onCheckedChange={(checked) => toggleNodeNarration(node.id, checked)}
              />
            </div>
          )}

          {/* Free-Text Input Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Enable Free-Text Input</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow players to type custom actions at this node
                  </p>
                </div>
              </div>
              <Switch
                checked={editedNode.allows_free_text}
                onCheckedChange={(checked) => 
                  setEditedNode({ ...editedNode, allows_free_text: checked })
                }
              />
            </div>
            
            {editedNode.allows_free_text && (
              <div className="space-y-2 pl-8">
                <Label>Free-Text Prompt (optional)</Label>
                <Textarea
                  value={editedNode.free_text_prompt || ""}
                  onChange={(e) => 
                    setEditedNode({ ...editedNode, free_text_prompt: e.target.value })
                  }
                  placeholder="What would you like to do? (e.g., 'How do you approach the situation?')"
                  rows={2}
                />
              </div>
            )}
          </div>

         {/* Choices */}
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <Label>Choices</Label>
             <Button variant="outline" size="sm" onClick={addChoice}>
               <Plus className="h-3 w-3 mr-1" />
               Add Choice
             </Button>
           </div>
 
           {editedNode.choices.map((choice, index) => (
             <Card key={choice.id} className="p-3">
               <div className="space-y-3">
                 <div className="flex items-start gap-2">
                   <Input
                     value={choice.choice_text}
                     onChange={(e) => updateChoice(index, { choice_text: e.target.value })}
                     placeholder="Choice text"
                     className="flex-1"
                   />
                   <Button
                     variant="ghost"
                     size="icon"
                     className="shrink-0 text-destructive"
                     onClick={() => removeChoice(index)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
                 <div className="flex items-center gap-2">
                   <Link2 className="h-4 w-4 text-muted-foreground" />
                   <Select
                     value={choice.target_node_id || "none"}
                     onValueChange={(v) => updateChoice(index, { target_node_id: v === "none" ? null : v })}
                   >
                     <SelectTrigger className="flex-1">
                       <SelectValue placeholder="Links to..." />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="none">End story</SelectItem>
                       {otherNodes.map(n => (
                         <SelectItem key={n.id} value={n.id}>
                           {n.title || "Untitled"}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </Card>
           ))}
         </div>
       </div>
 
       <DialogFooter className="flex-col sm:flex-row gap-2">
         <div className="flex gap-2 w-full sm:w-auto">
           <Button
             variant="destructive"
             size="sm"
             onClick={onDelete}
           >
             <Trash2 className="h-4 w-4 mr-1" />
             Delete
           </Button>
           {!isStartNode && (
             <Button
               variant="outline"
               size="sm"
               onClick={onSetStart}
             >
               Set as Start
             </Button>
           )}
         </div>
         <Button onClick={() => onSave(editedNode)} disabled={saving}>
           <Save className="h-4 w-4 mr-2" />
           {saving ? "Saving..." : "Save Node"}
         </Button>
       </DialogFooter>
     </>
   );
 };
 
 export default CampaignEditor;