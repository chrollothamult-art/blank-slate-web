  import { useState, useEffect } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import { motion, AnimatePresence } from "framer-motion";
  import { ArrowLeft, BookOpen, Lock, Sparkles, User, CheckCircle, XCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
  import { supabase } from "@/integrations/supabase/client";
  import { useAuth } from "@/contexts/AuthContext";
  import { useLoreChronicles, RpCampaign, RpStoryNode, RpNodeChoice, RpCharacter, CharacterStats } from "@/hooks/useLoreChronicles";
  import { toast } from "@/hooks/use-toast";
  import { FreeTextInput } from "@/components/lore-chronicles/FreeTextInput";
 
 const StoryPlayer = () => {
   const { campaignId } = useParams<{ campaignId: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { characters } = useLoreChronicles();
 
   const [campaign, setCampaign] = useState<RpCampaign | null>(null);
   const [currentNode, setCurrentNode] = useState<RpStoryNode | null>(null);
   const [choices, setChoices] = useState<RpNodeChoice[]>([]);
   const [loading, setLoading] = useState(true);
   const [sessionId, setSessionId] = useState<string | null>(null);
   const [characterProgress, setCharacterProgress] = useState<any>(null);
   
   const [showCharacterSelect, setShowCharacterSelect] = useState(false);
   const [selectedCharacter, setSelectedCharacter] = useState<RpCharacter | null>(null);
   const [processing, setProcessing] = useState(false);
 
   // Load campaign data
   useEffect(() => {
     const fetchCampaign = async () => {
       if (!campaignId) return;
 
       const { data, error } = await supabase
         .from("rp_campaigns")
         .select("*")
         .eq("id", campaignId)
         .single();
 
       if (error || !data) {
         toast({ title: "Campaign not found", variant: "destructive" });
         navigate('/lore-chronicles');
         return;
       }
 
       setCampaign(data);
       setLoading(false);
     };
 
     fetchCampaign();
   }, [campaignId, navigate]);
 
   // Show character selection when campaign loads
   useEffect(() => {
     if (campaign && user && !sessionId) {
       setShowCharacterSelect(true);
     }
   }, [campaign, user, sessionId]);
 
   // Start session with selected character
   const startSession = async (character: RpCharacter) => {
     if (!campaign || !user) return;
     setProcessing(true);
 
     // Create session
     const { data: session, error: sessionError } = await supabase
       .from("rp_sessions")
       .insert({
         campaign_id: campaign.id,
         created_by: user.id,
         current_node_id: campaign.start_node_id,
         mode: "solo",
         status: "active"
       })
       .select()
       .single();
 
     if (sessionError || !session) {
       toast({ title: "Failed to start session", variant: "destructive" });
       setProcessing(false);
       return;
     }
 
     // Add participant
    await supabase.from("rp_session_participants").insert([
      {
        session_id: session.id,
        character_id: character.id
      }
    ]);
 
     // Create progress
    await supabase.from("rp_character_progress").insert([
      {
        session_id: session.id,
        character_id: character.id,
        current_node_id: campaign.start_node_id,
       stats_snapshot: character.stats as unknown as Record<string, number>,
        nodes_visited: campaign.start_node_id ? [campaign.start_node_id] : []
      }
    ]);
 
     // Increment play count
     await supabase
       .from("rp_campaigns")
       .update({ play_count: (campaign.play_count || 0) + 1 })
       .eq("id", campaign.id);
 
     setSessionId(session.id);
     setSelectedCharacter(character);
     setCharacterProgress({
       stats_snapshot: character.stats,
       xp_earned: 0,
       story_flags: {}
     });
     setShowCharacterSelect(false);
 
     // Load first node
     if (campaign.start_node_id) {
       await loadNode(campaign.start_node_id);
     }
 
     setProcessing(false);
   };
 
   // Load a story node
   const loadNode = async (nodeId: string) => {
     const { data: node, error } = await supabase
       .from("rp_story_nodes")
       .select("*")
       .eq("id", nodeId)
       .single();
 
     if (error || !node) {
       toast({ title: "Failed to load story node", variant: "destructive" });
       return;
     }
 
     setCurrentNode({
       ...node,
       content: node.content as RpStoryNode["content"]
     });
 
     // Load choices for this node
     const { data: nodeChoices } = await supabase
       .from("rp_node_choices")
       .select("*")
       .eq("node_id", nodeId)
       .order("order_index");
 
     setChoices((nodeChoices || []).map(c => ({
       ...c,
       stat_requirement: c.stat_requirement as RpNodeChoice["stat_requirement"],
       stat_effect: c.stat_effect as RpNodeChoice["stat_effect"]
     })));
   };
 
   // Make a choice
   const makeChoice = async (choice: RpNodeChoice) => {
     if (!sessionId || !selectedCharacter || !currentNode) return;
     setProcessing(true);
 
     const stats = characterProgress?.stats_snapshot || selectedCharacter.stats;
 
     // Check stat requirement
     if (choice.stat_requirement) {
       const { stat, min_value } = choice.stat_requirement;
       const currentValue = stats[stat as keyof CharacterStats] || 0;
       
       if (currentValue < min_value) {
         toast({ 
           title: "Requirement not met", 
           description: `You need at least ${min_value} ${stat} for this choice.`,
           variant: "destructive" 
         });
         setProcessing(false);
         return;
       }
     }
 
     // Apply stat effects
     let newStats = { ...stats };
     let xpGained = currentNode.xp_reward || 0;
     
     if (choice.stat_effect) {
       Object.entries(choice.stat_effect).forEach(([key, value]) => {
         if (key in newStats && typeof value === "number") {
           newStats[key as keyof CharacterStats] = Math.max(1, Math.min(10, newStats[key as keyof CharacterStats] + value));
         }
       });
     }
 
     // Update progress in database
     const { data: progress } = await supabase
       .from("rp_character_progress")
       .select("*")
       .eq("session_id", sessionId)
       .eq("character_id", selectedCharacter.id)
       .single();
 
     const visitedNodes = progress?.nodes_visited || [];
     
     await supabase
       .from("rp_character_progress")
       .update({
         current_node_id: choice.target_node_id,
         stats_snapshot: newStats,
         xp_earned: (progress?.xp_earned || 0) + xpGained,
         nodes_visited: choice.target_node_id 
           ? [...visitedNodes, choice.target_node_id]
           : visitedNodes
       })
       .eq("session_id", sessionId)
       .eq("character_id", selectedCharacter.id);
 
     // Update session
     await supabase
       .from("rp_sessions")
       .update({
         current_node_id: choice.target_node_id,
         last_played_at: new Date().toISOString()
       })
       .eq("id", sessionId);
 
     setCharacterProgress({
       ...characterProgress,
       stats_snapshot: newStats,
       xp_earned: (characterProgress?.xp_earned || 0) + xpGained
     });
 
     // Load next node or end
     if (choice.target_node_id) {
       await loadNode(choice.target_node_id);
     } else {
       // End of story
       await supabase
         .from("rp_sessions")
         .update({ status: "completed", completed_at: new Date().toISOString() })
         .eq("id", sessionId);
 
       // Award XP to character
       const totalXp = (characterProgress?.xp_earned || 0) + xpGained + 100; // +100 completion bonus
       await supabase
         .from("rp_characters")
         .update({ 
           xp: selectedCharacter.xp + totalXp,
           stats: newStats
         })
         .eq("id", selectedCharacter.id);
 
       toast({ 
         title: "Adventure Complete!", 
         description: `You earned ${totalXp} XP!` 
       });
     }
 
     setProcessing(false);
   };
 
   // Check if choice is available
   const canMakeChoice = (choice: RpNodeChoice): { available: boolean; reason?: string } => {
     if (!choice.stat_requirement) return { available: true };
     
     const stats = characterProgress?.stats_snapshot || selectedCharacter?.stats || {};
     const { stat, min_value } = choice.stat_requirement;
     const currentValue = stats[stat as keyof CharacterStats] || 0;
     
     if (currentValue < min_value) {
       return { 
         available: false, 
         reason: `Requires ${min_value} ${stat} (you have ${currentValue})` 
       };
     }
     
     return { available: true };
   };
 
   if (!user) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center p-4">
         <Card className="max-w-md w-full text-center">
           <CardHeader>
             <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
             <CardTitle>Sign In Required</CardTitle>
             <CardDescription>You need to sign in to play</CardDescription>
           </CardHeader>
           <CardContent>
             <Button onClick={() => navigate('/auth')}>Sign In</Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-pulse text-center">
           <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
           <p className="text-muted-foreground">Loading adventure...</p>
         </div>
       </div>
     );
   }
 
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
               <h1 className="font-semibold">{campaign?.title}</h1>
               {selectedCharacter && (
                 <p className="text-sm text-muted-foreground">
                   Playing as {selectedCharacter.name}
                 </p>
               )}
             </div>
           </div>
 
           {selectedCharacter && characterProgress && (
             <div className="flex items-center gap-2">
               <Badge variant="outline" className="gap-1">
                 <Sparkles className="h-3 w-3" />
                 +{characterProgress.xp_earned} XP
               </Badge>
             </div>
           )}
         </div>
       </header>
 
       {/* Story Content */}
       <main className="container mx-auto px-4 py-8 max-w-3xl">
         <AnimatePresence mode="wait">
           {currentNode ? (
             <motion.div
               key={currentNode.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
               className="space-y-8"
             >
               {/* Node Image */}
               {currentNode.image_url && (
                 <div className="rounded-2xl overflow-hidden">
                   <img
                     src={currentNode.image_url}
                     alt={currentNode.title || "Scene"}
                     className="w-full h-64 object-cover"
                   />
                 </div>
               )}
 
               {/* Node Title */}
               {currentNode.title && (
                 <h2 className="text-2xl font-bold text-center">{currentNode.title}</h2>
               )}
 
               {/* NPC Portrait & Name */}
               {currentNode.content.npc_name && (
                 <div className="flex items-center gap-3 justify-center">
                   {currentNode.content.npc_portrait && (
                     <Avatar className="h-12 w-12 border-2 border-primary/20">
                       <AvatarImage src={currentNode.content.npc_portrait} />
                       <AvatarFallback>
                         {currentNode.content.npc_name.slice(0, 2).toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                   )}
                   <span className="font-semibold text-lg">{currentNode.content.npc_name}</span>
                 </div>
               )}
 
               {/* Story Text */}
               <Card>
                 <CardContent className="pt-6">
                   <p className="text-lg leading-relaxed whitespace-pre-wrap">
                     {currentNode.content.text || "The story continues..."}
                   </p>
                 </CardContent>
               </Card>
 
                {/* Choices */}
                {choices.length > 0 ? (
                  <div className="space-y-3">
                    {choices.map((choice, index) => {
                      const { available, reason } = canMakeChoice(choice);
                      
                      return (
                        <motion.div
                          key={choice.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Button
                            variant={available ? "outline" : "ghost"}
                            className={`w-full justify-start text-left h-auto py-4 px-6 ${
                              !available ? "opacity-50" : "hover:bg-primary/10 hover:border-primary"
                            }`}
                            onClick={() => available && makeChoice(choice)}
                            disabled={processing || !available}
                          >
                            <div className="flex items-start gap-3 w-full">
                              {!available && <Lock className="h-4 w-4 mt-0.5 shrink-0" />}
                              <div className="flex-1">
                                <p>{choice.choice_text}</p>
                                {reason && (
                                  <p className="text-xs text-muted-foreground mt-1">{reason}</p>
                                )}
                                {choice.stat_effect && available && (
                                  <div className="flex gap-2 mt-2">
                                    {Object.entries(choice.stat_effect).map(([stat, value]) => (
                                      <Badge 
                                        key={stat} 
                                        variant="secondary" 
                                        className="text-xs"
                                      >
                                       {stat}: {typeof value === "number" && value > 0 ? "+" : ""}{String(value)}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : null}

                {/* Free-Text Input */}
                {(currentNode as any).allows_free_text && (
                  <FreeTextInput
                    prompt={(currentNode as any).free_text_prompt}
                    disabled={processing}
                    onSubmit={async (text) => {
                      if (!sessionId || !selectedCharacter || !currentNode) return;
                      setProcessing(true);
                      
                      await supabase.from("rp_free_text_responses").insert({
                        session_id: sessionId,
                        character_id: selectedCharacter.id,
                        node_id: currentNode.id,
                        response_text: text,
                      });

                      // Store in story flags
                      const { data: progress } = await supabase
                        .from("rp_character_progress")
                        .select("story_flags")
                        .eq("session_id", sessionId)
                        .eq("character_id", selectedCharacter.id)
                        .single();

                      const flags = (progress?.story_flags as Record<string, unknown>) || {};
                      await supabase
                        .from("rp_character_progress")
                        .update({
                          story_flags: JSON.parse(JSON.stringify({ ...flags, [`free_text_${currentNode.id}`]: text })),
                        })
                        .eq("session_id", sessionId)
                        .eq("character_id", selectedCharacter.id);

                      toast({ title: "Response recorded!" });
                      setProcessing(false);
                    }}
                  />
                )}

                {/* Ending */}
                {currentNode.node_type === "ending" && choices.length === 0 ? (
                  <Card className="text-center py-8 border-primary">
                    <CardContent>
                      <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">The End</h3>
                      <p className="text-muted-foreground mb-6">
                        Your adventure has concluded. Well done, hero!
                      </p>
                      <Button onClick={() => navigate('/lore-chronicles')}>
                        Return to Lore Chronicles
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
             </motion.div>
           ) : !campaign?.start_node_id ? (
             <Card className="text-center py-12">
               <CardContent>
                 <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-xl font-semibold mb-2">Campaign Not Ready</h3>
                 <p className="text-muted-foreground mb-4">
                   This campaign doesn't have any content yet.
                 </p>
                 <Button variant="outline" onClick={() => navigate('/lore-chronicles')}>
                   Back to Campaigns
                 </Button>
               </CardContent>
             </Card>
           ) : null}
         </AnimatePresence>
       </main>
 
       {/* Character Selection Dialog */}
       <Dialog open={showCharacterSelect} onOpenChange={setShowCharacterSelect}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>Choose Your Character</DialogTitle>
             <DialogDescription>
               Select a character to embark on this adventure
             </DialogDescription>
           </DialogHeader>
 
           {characters.length === 0 ? (
             <div className="text-center py-6">
               <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
               <p className="text-muted-foreground mb-4">You don't have any characters yet</p>
               <Button onClick={() => navigate('/lore-chronicles/create-character')}>
                 Create Character
               </Button>
             </div>
           ) : (
             <div className="space-y-3 max-h-80 overflow-y-auto">
               {characters.filter(c => c.is_active).map(character => (
                 <Card
                   key={character.id}
                   className="cursor-pointer hover:border-primary transition-colors"
                   onClick={() => startSession(character)}
                 >
                   <CardHeader className="p-4">
                     <div className="flex items-center gap-3">
                       <Avatar className="h-12 w-12">
                         <AvatarImage src={character.portrait_url || undefined} />
                         <AvatarFallback>
                           {character.name.slice(0, 2).toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                       <div className="flex-1">
                         <CardTitle className="text-base">{character.name}</CardTitle>
                         <CardDescription>
                           {character.race?.name || "Custom Origin"} • Level {character.level}
                         </CardDescription>
                       </div>
                       <Button size="sm" disabled={processing}>
                         {processing ? "Starting..." : "Select"}
                       </Button>
                     </div>
                   </CardHeader>
                 </Card>
               ))}
             </div>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
 export default StoryPlayer;