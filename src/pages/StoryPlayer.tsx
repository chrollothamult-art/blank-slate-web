import { useState, useEffect, useCallback } from "react";
   import { useNavigate, useParams } from "react-router-dom";
   import { motion, AnimatePresence } from "framer-motion";
   import { ArrowLeft, BookOpen, Lock, Sparkles, User, CheckCircle, XCircle, Skull, Package, AlertTriangle, ShieldAlert, Zap, Backpack } from "lucide-react";
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
    import { HintDisplay } from "@/components/lore-chronicles/HintDisplay";
    import { ActionHistoryPanel } from "@/components/lore-chronicles/ActionHistoryPanel";
    import { useHints, Hint, HintResponse as HintResponseType } from "@/hooks/useHints";
    import { useRpAchievements } from "@/hooks/useRpAchievements";
    import { useInventory } from "@/hooks/useInventory";
    import { LoreTooltipText } from "@/components/lore-chronicles/LoreTooltipText";
     import { NarrationPanel } from "@/components/lore-chronicles/NarrationPanel";
     import { NodeAudioPlayer } from "@/components/lore-chronicles/NodeAudioPlayer";
     import { WeatherOverlay, WeatherType } from "@/components/lore-chronicles/WeatherOverlay";
     import { NPCPortraitDisplay } from "@/components/lore-chronicles/NPCPortraitDisplay";
import { ShortcutOverlay } from "@/components/lore-chronicles/ShortcutOverlay";
     import { useStoryPlayerShortcuts } from "@/hooks/useStoryPlayerShortcuts";
     import { PlayerInteractionsMenu, PlayerAction } from "@/components/lore-chronicles/PlayerInteractionsMenu";
     import { PlayerInventoryMenu, ItemAction } from "@/components/lore-chronicles/PlayerInventoryMenu";
 
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
     const [activeHints, setActiveHints] = useState<Hint[]>([]);
     const [statChecksPassed, setStatChecksPassed] = useState(0);
     const [statChecksFailed, setStatChecksFailed] = useState(0);
     const [isFirstCompletion, setIsFirstCompletion] = useState(true);
     const { checkAchievements } = useRpAchievements();

    // Inventory hook for the selected character
    const { hasItem, inventory } = useInventory(selectedCharacter?.id);

    // Player menus state
    const [interactionsOpen, setInteractionsOpen] = useState(false);
    const [inventoryMenuOpen, setInventoryMenuOpen] = useState(false);

    // Keyboard shortcuts
    useStoryPlayerShortcuts({
      choices,
      onChoiceSelect: (index) => {
        if (choices[index]) makeChoice(choices[index]);
      },
      onMenu: () => navigate('/lore-chronicles'),
      enabled: !!sessionId && !processing && !showCharacterSelect,
    });
 
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

      // Check if this is the first time playing this campaign
      const { data: previousSessions } = await supabase
        .from("rp_sessions")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("created_by", user.id)
        .eq("status", "completed");
      
      setIsFirstCompletion(!previousSessions || previousSessions.length === 0);

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
 
      // Check item requirement
      if (choice.item_requirement) {
        const hasRequired = hasItem(choice.item_requirement);
        if (!hasRequired) {
          // Look up item name for better messaging
          const { data: requiredItem } = await supabase
            .from("rp_items")
            .select("name, icon_emoji")
            .eq("id", choice.item_requirement)
            .single();
          
          toast({
            title: "Missing required item",
            description: `You need ${requiredItem?.icon_emoji || "📦"} ${requiredItem?.name || "a specific item"} for this choice.`,
            variant: "destructive"
          });
          setProcessing(false);
          return;
        }
      }

       // Check stat requirement & track stat checks
       if (choice.stat_requirement) {
         const { stat, min_value } = choice.stat_requirement;
         const currentValue = stats[stat as keyof CharacterStats] || 0;
         
         if (currentValue < min_value) {
           setStatChecksFailed(prev => prev + 1);
           toast({ 
             title: "Requirement not met", 
             description: `You need at least ${min_value} ${stat} for this choice.`,
             variant: "destructive" 
           });
           setProcessing(false);
           return;
         }
         
         // Stat check passed — bonus XP and track by type
         setStatChecksPassed(prev => prev + 1);
         
         // Update stat_checks_by_type in progress
         const { data: progressData } = await supabase
           .from("rp_character_progress")
           .select("stat_checks_by_type")
           .eq("session_id", sessionId)
           .eq("character_id", selectedCharacter.id)
           .single();
         
         const statChecks = (progressData?.stat_checks_by_type as Record<string, number>) || {};
         statChecks[stat] = (statChecks[stat] || 0) + 1;
         
         await supabase
           .from("rp_character_progress")
           .update({ stat_checks_by_type: statChecks })
           .eq("session_id", sessionId)
           .eq("character_id", selectedCharacter.id);
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
         // Check if next node is a death node
         const { data: nextNode } = await supabase
           .from("rp_story_nodes")
           .select("node_type")
           .eq("id", choice.target_node_id)
           .single();

         if (nextNode?.node_type === "death") {
           // Handle character death
           await handleCharacterDeath(choice.target_node_id, newStats);
         }

         await loadNode(choice.target_node_id);
       } else {
         // End of story — complete session & track ending
         await handleSessionComplete(newStats, xpGained);
       }
  
      setProcessing(false);
    };

     // Handle character death
     const handleCharacterDeath = async (deathNodeId: string, currentStats: CharacterStats) => {
       if (!sessionId || !selectedCharacter || !campaign) return;

       // Mark session as completed with death
       await supabase
         .from("rp_sessions")
         .update({ status: "completed", completed_at: new Date().toISOString() })
         .eq("id", sessionId);

       // Get death node info
       const { data: deathNode } = await supabase
         .from("rp_story_nodes")
         .select("title, content")
         .eq("id", deathNodeId)
         .single();

       const deathCause = (deathNode?.content as any)?.text?.slice(0, 100) || deathNode?.title || "Unknown cause";

       // Check if campaign has permadeath enabled
       const isPermadeath = (campaign as any).permadeath === true;

       if (isPermadeath) {
         // PERMADEATH: Permanently delete the character
         await supabase
           .from("rp_characters")
           .delete()
           .eq("id", selectedCharacter.id);

         toast({
           title: `${selectedCharacter.name} is gone forever... 💀☠️`,
           description: "Permadeath mode: This character has been permanently deleted.",
           variant: "destructive",
         });
       } else {
         // Normal death: Mark character as fallen
         await supabase
           .from("rp_characters")
           .update({
             is_active: false,
             fallen_at: new Date().toISOString(),
             death_context: {
               campaign_title: campaign.title,
               campaign_id: campaign.id,
               node_title: deathNode?.title || "Unknown",
               cause: deathCause,
             },
             stats: currentStats as unknown as Record<string, number>,
           })
           .eq("id", selectedCharacter.id);

         // Award partial XP (half of earned)
         const partialXp = Math.floor((characterProgress?.xp_earned || 0) / 2);
         if (partialXp > 0) {
           await supabase
             .from("rp_characters")
             .update({ xp: selectedCharacter.xp + partialXp })
             .eq("id", selectedCharacter.id);
         }

         // Generate legacy bonus for future characters
         const legacyBonus: Record<string, unknown> = {
           from_character: selectedCharacter.name,
           xp_bonus: Math.floor(selectedCharacter.xp * 0.1),
           fallen_level: selectedCharacter.level,
         };

         await supabase
           .from("rp_characters")
           .update({ legacy_bonuses: legacyBonus as unknown as Record<string, number> })
           .eq("id", selectedCharacter.id);

         toast({
           title: `${selectedCharacter.name} has fallen... 💀`,
           description: `Earned ${partialXp} XP. Their legacy will aid future heroes.`,
         });
       }
     };

    // Handle successful session completion
    const handleSessionComplete = async (newStats: CharacterStats, xpGained: number) => {
      if (!sessionId || !selectedCharacter || !campaign || !currentNode) return;

      await supabase
        .from("rp_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId);

      // Record ending seen for Completionist achievement
      if (user && currentNode.node_type === "ending") {
        await supabase
          .from("rp_campaign_endings_seen")
          .upsert({
            user_id: user.id,
            campaign_id: campaign.id,
            ending_node_id: currentNode.id,
          }, { onConflict: "user_id,campaign_id,ending_node_id" });
      }

      // Calculate XP with bonuses
      let baseXp = (characterProgress?.xp_earned || 0) + xpGained;
      let completionBonus = 100;
      let firstTimeBonus = isFirstCompletion ? 50 : 0;
      let statCheckBonus = statChecksPassed * 20;
      let perfectRunBonus = statChecksFailed === 0 && statChecksPassed > 0 ? 50 : 0;
      
      let difficultyMultiplier = 1;
      if (campaign?.difficulty === "hard") difficultyMultiplier = 1.5;
      else if (campaign?.difficulty === "expert") difficultyMultiplier = 2;

      const totalXp = Math.floor(
        (baseXp + completionBonus + firstTimeBonus + statCheckBonus + perfectRunBonus) * difficultyMultiplier
      );

      await supabase
        .from("rp_characters")
        .update({ 
          xp: selectedCharacter.xp + totalXp,
          stats: newStats as unknown as Record<string, number>
        })
        .eq("id", selectedCharacter.id);

      const bonusParts: string[] = [];
      if (firstTimeBonus > 0) bonusParts.push(`First clear +${firstTimeBonus}`);
      if (statCheckBonus > 0) bonusParts.push(`Stat checks +${statCheckBonus}`);
      if (perfectRunBonus > 0) bonusParts.push(`Perfect run +${perfectRunBonus}`);
      if (difficultyMultiplier > 1) bonusParts.push(`Difficulty x${difficultyMultiplier}`);

      toast({ 
        title: "Adventure Complete! 🎉", 
        description: `You earned ${totalXp} XP!${bonusParts.length > 0 ? ` (${bonusParts.join(', ')})` : ''}`
      });

      await checkAchievements();
    };
 
   // Check if choice is available (stat + item requirements)
   const canMakeChoice = (choice: RpNodeChoice): { available: boolean; reason?: string } => {
     // Check item requirement
     if (choice.item_requirement) {
       const hasRequired = hasItem(choice.item_requirement);
       if (!hasRequired) {
         return {
           available: false,
           reason: `Requires a specific item`
         };
       }
     }

     // Check stat requirement
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
 
    // Render story content with inline images and lore tooltips
    const renderStoryContent = (text: string) => {
      // Split on inline image syntax: ![alt](url)
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const parts: Array<{ type: "text" | "image"; content: string; alt?: string }> = [];
      let lastIndex = 0;
      let match;

      while ((match = imageRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: "image", content: match[2], alt: match[1] });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        parts.push({ type: "text", content: text.slice(lastIndex) });
      }

      return parts.map((part, i) => {
        if (part.type === "image") {
          return (
            <div key={i} className="rounded-xl overflow-hidden my-4">
              <img
                src={part.content}
                alt={part.alt || "Story illustration"}
                className="w-full max-h-96 object-cover"
                loading="lazy"
              />
              {part.alt && (
                <p className="text-xs text-muted-foreground text-center mt-1 italic">{part.alt}</p>
              )}
            </div>
          );
        }
        return (
          <LoreTooltipText
            key={i}
            text={part.content}
            className="text-lg leading-relaxed whitespace-pre-wrap"
          />
        );
      });
    };

   if (!user) {
     return (
       <div className="min-h-screen rpg-page flex items-center justify-center p-4">
         <div className="rpg-card rounded-lg max-w-md w-full text-center p-8">
           <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
           <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
           <p className="text-muted-foreground mb-4">You need to sign in to play</p>
           <Button onClick={() => navigate('/auth')} className="rpg-btn-primary text-primary-foreground border-0">
             Sign In
           </Button>
         </div>
       </div>
     );
   }
 
   if (loading) {
     return (
       <div className="min-h-screen rpg-page flex items-center justify-center">
         <motion.div 
           className="text-center"
           animate={{ opacity: [0.5, 1, 0.5] }}
           transition={{ duration: 2, repeat: Infinity }}
         >
           <BookOpen className="h-16 w-16 text-accent mx-auto mb-4 rpg-float" />
           <p className="text-muted-foreground">Loading adventure...</p>
         </motion.div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen rpg-page">
       {/* Header */}
       <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
         <div className="container mx-auto px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')} className="hover:bg-accent/10">
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <h1 className="font-semibold">{campaign?.title}</h1>
               {selectedCharacter && (
                 <p className="text-sm text-muted-foreground">
                   Playing as <span className="text-accent">{selectedCharacter.name}</span>
                 </p>
               )}
             </div>
           </div>
 
             {selectedCharacter && characterProgress && (
               <div className="flex items-center gap-2">
                 {(campaign as any)?.permadeath && (
                   <Badge variant="destructive" className="gap-1">
                     <Skull className="h-3 w-3" />
                     Permadeath
                   </Badge>
                 )}
                 <Button variant="ghost" size="icon" onClick={() => setInteractionsOpen(true)} title="Actions">
                   <Zap className="h-5 w-5" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setInventoryMenuOpen(true)} title="Inventory">
                   <Backpack className="h-5 w-5" />
                 </Button>
                 <Badge variant="outline" className="gap-1 border-accent/30 text-accent">
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
                {/* Location Backdrop with Parallax + Day/Night Tint */}
                {currentNode.content.backdrop_url && (
                  <div className="rounded-2xl overflow-hidden relative -mx-4 md:-mx-8">
                    <motion.div
                      style={{ willChange: "transform" }}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <img
                        src={currentNode.content.backdrop_url}
                        alt="Scene backdrop"
                        className="w-full h-48 md:h-72 object-cover scale-105"
                      />
                    </motion.div>
                    {/* Day/Night color tint overlay */}
                    {currentNode.content.time_of_day && currentNode.content.time_of_day !== "day" && (
                      <div className={`absolute inset-0 pointer-events-none transition-colors duration-700 ${
                        currentNode.content.time_of_day === "night"
                          ? "bg-blue-950/50"
                          : currentNode.content.time_of_day === "dawn"
                          ? "bg-orange-400/20"
                          : currentNode.content.time_of_day === "dusk"
                          ? "bg-amber-700/30"
                          : ""
                      }`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    {/* Weather Overlay on backdrop */}
                    <WeatherOverlay weather={(currentNode.content.weather as WeatherType) || "none"} />
                  </div>
                )}

                {/* Weather overlay without backdrop */}
                {!currentNode.content.backdrop_url && currentNode.content.weather && currentNode.content.weather !== "none" && (
                  <div className="relative rounded-2xl overflow-hidden -mx-4 md:-mx-8 h-32 bg-muted/30">
                    <WeatherOverlay weather={currentNode.content.weather as WeatherType} />
                  </div>
                )}

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

                {/* Background Audio */}
                {currentNode.audio_url && (
                  <NodeAudioPlayer
                    audioUrl={currentNode.audio_url}
                    nodeId={currentNode.id}
                  />
                )}
  
               {/* Node Title */}
               {currentNode.title && (
                 <h2 className="text-2xl font-bold text-center">{currentNode.title}</h2>
               )}

                {/* NPC Portrait with Animated Idle & Voice Line */}
                {currentNode.content.npc_name && (
                  <div className="flex flex-col items-center gap-2">
                    <NPCPortraitDisplay
                      name={currentNode.content.npc_name}
                      portraitUrl={currentNode.content.npc_portrait}
                      speaking={!!currentNode.content.npc_voice_url}
                      size="lg"
                      position="center"
                    />
                    {currentNode.content.npc_voice_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => {
                          const audio = new Audio(currentNode.content.npc_voice_url);
                          audio.volume = 0.7;
                          audio.play().catch(() => {});
                        }}
                      >
                        🔊 Play Voice Line
                      </Button>
                    )}
                  </div>
                )}
 
                {/* Story Text with Inline Lore Tooltips & Images */}
                <div className="rpg-card rounded-lg p-6 space-y-4">
                    {renderStoryContent(currentNode.content.text || "The story continues...")}
                </div>

                {/* Hints */}
                {activeHints.length > 0 && (
                  <HintDisplay
                    hints={activeHints}
                    onRespond={async (hintId, response) => {
                      // Record response — outcome can be used for random event triggers
                      toast({
                        title: response === "followed" ? "You heed the hint..." : 
                               response === "opposite" ? "You defy the suggestion!" : 
                               "You ignore the hint...",
                      });
                    }}
                    disabled={processing}
                  />
                )}
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
                              !available ? "opacity-50" : "hover:bg-accent/10 hover:border-accent/40 border-border/50"
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
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {choice.item_requirement && (
                                    <Badge variant={available ? "secondary" : "destructive"} className="text-xs gap-1">
                                      <Package className="h-3 w-3" />
                                      Item required
                                    </Badge>
                                  )}
                                  {choice.stat_effect && available && (
                                    <>
                                      {Object.entries(choice.stat_effect).map(([stat, value]) => (
                                        <Badge 
                                          key={stat} 
                                          variant="secondary" 
                                          className="text-xs"
                                        >
                                         {stat}: {typeof value === "number" && value > 0 ? "+" : ""}{String(value)}
                                        </Badge>
                                      ))}
                                    </>
                                  )}
                                </div>
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

                {/* Action History Panel */}
                <ActionHistoryPanel
                  sessionId={sessionId}
                  characterId={selectedCharacter?.id ?? null}
                />

                {/* Death Node */}
                {currentNode.node_type === "death" && (
                  <Card className="text-center py-8 border-destructive">
                    <CardContent>
                      <Skull className="h-16 w-16 text-destructive mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">You Have Fallen</h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedCharacter?.name} has met their end in this adventure.
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Their legacy will grant bonuses to your future characters.
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={() => navigate('/lore-chronicles')}>
                          Return to Lore Chronicles
                        </Button>
                        <Button onClick={() => navigate('/lore-chronicles/create-character')}>
                          Create New Character
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
 
        {/* Player Interactions Menu */}
        {selectedCharacter && characterProgress && (
          <>
            <PlayerInteractionsMenu
              characterStats={characterProgress.stats_snapshot || selectedCharacter.stats}
              inventory={inventory}
              onAction={async (action: PlayerAction) => {
                setInteractionsOpen(false);
                // Submit as free-text action for AI interpretation
                if (!sessionId || !selectedCharacter || !currentNode) return;
                setProcessing(true);
                await supabase.from("rp_free_text_responses").insert({
                  session_id: sessionId,
                  character_id: selectedCharacter.id,
                  node_id: currentNode.id,
                  response_text: `I ${action.name.toLowerCase()}: ${action.description}`,
                });
                toast({ title: `${action.icon} ${action.name}`, description: action.description });
                setProcessing(false);
              }}
              disabled={processing}
              open={interactionsOpen}
              onOpenChange={setInteractionsOpen}
            />
            <PlayerInventoryMenu
              characterId={selectedCharacter.id}
              open={inventoryMenuOpen}
              onOpenChange={setInventoryMenuOpen}
              onItemAction={(itemAction: ItemAction) => {
                setInventoryMenuOpen(false);
                toast({
                  title: `Item Action: ${itemAction.actionType}`,
                  description: `Used ${itemAction.actionType} on ${itemAction.itemName}`,
                });
              }}
            />
          </>
        )}

        {/* Character Selection Dialog */}
       <Dialog open={showCharacterSelect} onOpenChange={setShowCharacterSelect}>
         <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Choose Your Character</DialogTitle>
              <DialogDescription>
                Select a character to embark on this adventure
              </DialogDescription>
              {(campaign as any)?.permadeath && (
                <div className="flex items-center gap-2 p-3 mt-2 rounded-lg border border-destructive/30 bg-destructive/5">
                  <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive font-medium">
                    ☠️ Permadeath Mode — If your character dies, they are <strong>permanently deleted</strong>.
                  </p>
                </div>
              )}
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

        {/* Keyboard shortcut overlay */}
        {sessionId && <ShortcutOverlay />}
      </div>
   );
 };
 
 export default StoryPlayer;