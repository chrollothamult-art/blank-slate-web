import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, BookOpen, Lock, Sparkles, User, CheckCircle, XCircle, 
  Users, Clock, Send, MessageSquare, Share2, Copy, Check,
  Flag, Zap, PanelRight, PanelRightClose
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLoreChronicles, RpCampaign, RpStoryNode, RpNodeChoice, RpCharacter, CharacterStats } from "@/hooks/useLoreChronicles";
import { toast } from "@/hooks/use-toast";
import { useSessionTriggers } from "@/hooks/useSessionTriggers";
import { TriggerLog } from "@/components/lore-chronicles/TriggerLog";
import { KeyPointProgress } from "@/components/lore-chronicles/KeyPointProgress";
import { AITransitionScreen } from "@/components/lore-chronicles/AITransitionScreen";
import { useIPScores, getRelationshipLevel, RELATIONSHIP_LEVEL_CONFIG } from "@/hooks/useIPScores";
import { PastAction } from "@/hooks/useFreeTextInterpreter";

interface SessionParticipant {
  id: string;
  character_id: string;
  is_active: boolean;
  joined_at: string;
  character?: RpCharacter;
  user?: { username: string; avatar_url: string | null };
}

interface SessionMessage {
  id: string;
  user_id: string;
  message_type: "chat" | "action" | "system" | "roll";
  content: string;
  created_at: string;
  user?: { username: string; avatar_url: string | null };
}

interface SessionData {
  id: string;
  campaign_id: string;
  created_by: string;
  mode: "solo" | "group" | "async";
  status: "active" | "completed" | "paused";
  current_node_id: string | null;
  story_flags: Record<string, unknown>;
  max_players: number;
  current_turn_player_id: string | null;
  turn_deadline: string | null;
  session_code: string | null;
  started_at: string;
  last_played_at: string;
  campaign?: RpCampaign;
}

const SessionPlayer = () => {
  const { sessionId, campaignId } = useParams<{ sessionId?: string; campaignId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { characters } = useLoreChronicles();

  const [session, setSession] = useState<SessionData | null>(null);
  const [campaign, setCampaign] = useState<RpCampaign | null>(null);
  const [currentNode, setCurrentNode] = useState<RpStoryNode | null>(null);
  const [choices, setChoices] = useState<RpNodeChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [characterProgress, setCharacterProgress] = useState<any>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<RpCharacter | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sidePanel, setSidePanel] = useState<"chat" | "party" | "triggers" | "milestones">("party");
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [firedTriggerIds, setFiredTriggerIds] = useState<string[]>([]);
  const [triggerMessages, setTriggerMessages] = useState<string[]>([]);
  const [actionHistory, setActionHistory] = useState<PastAction[]>([]);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionNarration, setTransitionNarration] = useState("");

  // Get campaign ID for triggers
  const activeCampaignId = campaign?.id || session?.campaign_id || "";
  const {
    triggerLog,
    loadTriggers,
    loadTriggerLog,
    evaluateTriggers,
  } = useSessionTriggers(activeCampaignId);

  // Check if it's current player's turn in async/group mode
  const isMyTurn = useCallback(() => {
    if (!session || !user) return true;
    if (session.mode === "solo") return true;
    return session.current_turn_player_id === user.id;
  }, [session, user]);

  // Load existing session
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return;

      const { data, error } = await supabase
        .from("rp_sessions")
        .select(`
          *,
          campaign:rp_campaigns(*)
        `)
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        toast({ title: "Session not found", variant: "destructive" });
        navigate('/lore-chronicles');
        return;
      }

      const sessionData: SessionData = {
        id: data.id,
        campaign_id: data.campaign_id,
        created_by: data.created_by,
        mode: data.mode as SessionData["mode"],
        status: data.status as SessionData["status"],
        current_node_id: data.current_node_id,
        story_flags: (data.story_flags || {}) as Record<string, unknown>,
        max_players: data.max_players || 1,
        current_turn_player_id: data.current_turn_player_id,
        turn_deadline: data.turn_deadline,
        session_code: data.session_code,
        started_at: data.started_at,
        last_played_at: data.last_played_at,
        campaign: data.campaign as RpCampaign
      };

      setSession(sessionData);
      setCampaign(data.campaign as RpCampaign);

      // Load participant info
      await loadParticipants(sessionId);
      
      // Load character progress for current user
      if (user) {
        const { data: progressData } = await supabase
          .from("rp_character_progress")
          .select(`
            *,
            character:rp_characters(*)
          `)
          .eq("session_id", sessionId)
          .single();

        if (progressData) {
          setCharacterProgress({
            stats_snapshot: progressData.stats_snapshot,
            xp_earned: progressData.xp_earned || 0,
            story_flags: progressData.story_flags || {}
          });
          
          const charData = progressData.character as unknown;
          if (charData && typeof charData === 'object') {
            setSelectedCharacter(charData as RpCharacter);
          }
        }
      }

      // Load current node
      if (data.current_node_id) {
        await loadNode(data.current_node_id);
      }

      setLoading(false);
    };

    const loadNewCampaign = async () => {
      if (!campaignId || sessionId) return;

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

      setCampaign(data as RpCampaign);
      setLoading(false);
    };

    if (sessionId) {
      loadSession();
    } else if (campaignId) {
      loadNewCampaign();
    }
  }, [sessionId, campaignId, navigate, user]);

  // Show character selection when campaign loads without session
  useEffect(() => {
    if (campaign && user && !session) {
      setShowCharacterSelect(true);
    }
  }, [campaign, user, session]);

  // Load triggers when campaign is available
  useEffect(() => {
    if (activeCampaignId) {
      loadTriggers();
    }
  }, [activeCampaignId, loadTriggers]);

  // Load trigger log when session exists
  useEffect(() => {
    if (session?.id) {
      loadTriggerLog(session.id);
    }
  }, [session?.id, loadTriggerLog]);

  // Subscribe to realtime updates for group/async sessions
  useEffect(() => {
    if (!session || session.mode === "solo") return;

    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rp_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as SessionData;
            setSession(prev => prev ? { ...prev, ...newData } : null);
            if (newData.current_node_id && newData.current_node_id !== currentNode?.id) {
              loadNode(newData.current_node_id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rp_session_messages', filter: `session_id=eq.${session.id}` },
        async (payload) => {
          if (payload.new) {
            const newMsg = payload.new as SessionMessage;
            // Fetch user info
            const { data: userData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", newMsg.user_id)
              .single();
            
            setMessages(prev => [...prev, { ...newMsg, user: userData || undefined }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, currentNode?.id]);

  // Load session messages for group sessions
  useEffect(() => {
    const loadMessages = async () => {
      if (!session || session.mode === "solo") return;

      const { data } = await supabase
        .from("rp_session_messages")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        // Fetch user info for all messages
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const userMap = new Map(users?.map(u => [u.id, u]) || []);
        
        setMessages(data.map(m => ({
          ...m,
          message_type: m.message_type as SessionMessage["message_type"],
          user: userMap.get(m.user_id)
        })));
      }
    };

    loadMessages();
  }, [session]);

  const loadParticipants = async (sid: string) => {
    const { data } = await supabase
      .from("rp_session_participants")
      .select(`
        *,
        character:rp_characters(*, race:almanac_races(name))
      `)
      .eq("session_id", sid);

    if (data) {
      const participantsWithUsers: SessionParticipant[] = [];
      for (const p of data) {
        const char = p.character as unknown as RpCharacter;
        let userData = null;
        if (char?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", char.user_id)
            .single();
          userData = profile;
        }
        participantsWithUsers.push({
          id: p.id,
          character_id: p.character_id,
          is_active: p.is_active,
          joined_at: p.joined_at,
          character: char,
          user: userData || undefined
        });
      }
      setParticipants(participantsWithUsers);
    }
  };

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

  // Start a new session
  const startSession = async (character: RpCharacter, mode: "solo" | "group" | "async" = "solo") => {
    if (!campaign || !user) return;
    setProcessing(true);

    const sessionCode = mode !== "solo" ? generateCode() : null;

    const { data: newSession, error: sessionError } = await supabase
      .from("rp_sessions")
      .insert({
        campaign_id: campaign.id,
        created_by: user.id,
        current_node_id: campaign.start_node_id,
        mode,
        status: "active",
        max_players: mode === "solo" ? 1 : 4,
        session_code: sessionCode,
        current_turn_player_id: mode !== "solo" ? user.id : null
      })
      .select()
      .single();

    if (sessionError || !newSession) {
      toast({ title: "Failed to start session", variant: "destructive" });
      setProcessing(false);
      return;
    }

    // Add participant
    await supabase.from("rp_session_participants").insert({
      session_id: newSession.id,
      character_id: character.id
    });

    // Create progress
    await supabase.from("rp_character_progress").insert({
      session_id: newSession.id,
      character_id: character.id,
      current_node_id: campaign.start_node_id,
      stats_snapshot: character.stats as unknown as Record<string, number>,
      nodes_visited: campaign.start_node_id ? [campaign.start_node_id] : []
    });

    // Increment play count
    await supabase
      .from("rp_campaigns")
      .update({ play_count: (campaign.play_count || 0) + 1 })
      .eq("id", campaign.id);

    // Add system message for group sessions
    if (mode !== "solo") {
      await supabase.from("rp_session_messages").insert({
        session_id: newSession.id,
        user_id: user.id,
        message_type: "system",
        content: `${character.name} started the adventure!`
      });
    }

    setSession({
      id: newSession.id,
      campaign_id: newSession.campaign_id,
      created_by: newSession.created_by,
      mode: mode,
      status: "active",
      current_node_id: newSession.current_node_id,
      story_flags: {},
      max_players: newSession.max_players || 1,
      current_turn_player_id: newSession.current_turn_player_id,
      turn_deadline: newSession.turn_deadline,
      session_code: sessionCode,
      started_at: newSession.started_at,
      last_played_at: newSession.last_played_at,
      campaign
    });
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

    await loadParticipants(newSession.id);
    setProcessing(false);

    if (mode !== "solo") {
      setShowInviteDialog(true);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Make a choice
  const makeChoice = async (choice: RpNodeChoice) => {
    if (!session || !selectedCharacter || !currentNode) return;
    if (!isMyTurn()) {
      toast({ title: "Wait for your turn", variant: "destructive" });
      return;
    }
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

    // Track the choice in story flags for trigger evaluation
    const currentFlags = characterProgress?.story_flags || {};
    const choicesMade = (currentFlags.choices_made || []) as Array<{ node_id: string; choice_text: string }>;
    const updatedFlags = {
      ...currentFlags,
      choices_made: [...choicesMade, { node_id: currentNode.id, choice_text: choice.choice_text }],
    };

    // Evaluate triggers against the new state
    const sessionState = {
      stats: newStats,
      storyFlags: updatedFlags,
      items: (currentFlags.items || []) as string[],
      nodeId: choice.target_node_id || undefined,
      playerCount: participants.length || 1,
    };

    const triggerResult = await evaluateTriggers(
      session.id,
      selectedCharacter.id,
      sessionState,
      firedTriggerIds
    );

    // Apply trigger effects to stats and flags
    if (triggerResult.stateUpdates.stats) {
      newStats = { ...newStats, ...triggerResult.stateUpdates.stats };
    }
    const finalFlags = {
      ...updatedFlags,
      ...(triggerResult.stateUpdates.storyFlags || {}),
    };
    const finalItems = triggerResult.stateUpdates.items || (currentFlags.items as string[]) || [];

    xpGained += triggerResult.xpAwarded;

    // Track which triggers have fired
    const newFiredIds = triggerResult.firedTriggers.map((ft) => ft.trigger_id);
    setFiredTriggerIds((prev) => [...prev, ...newFiredIds]);

    // Show trigger messages
    if (triggerResult.messages.length > 0) {
      setTriggerMessages(triggerResult.messages);
      for (const msg of triggerResult.messages) {
        toast({ title: "⚡ Event Triggered", description: msg });
      }
    }

    // Update progress in database
    const { data: progress } = await supabase
      .from("rp_character_progress")
      .select("*")
      .eq("session_id", session.id)
      .eq("character_id", selectedCharacter.id)
      .single();

    const newVisitedNodes = choice.target_node_id
      ? [...(progress?.nodes_visited || []), choice.target_node_id]
      : progress?.nodes_visited || [];

    setVisitedNodeIds(newVisitedNodes as string[]);
    
    await supabase
      .from("rp_character_progress")
      .update({
        current_node_id: choice.target_node_id,
        stats_snapshot: newStats,
        xp_earned: (progress?.xp_earned || 0) + xpGained,
        nodes_visited: newVisitedNodes,
        story_flags: JSON.parse(JSON.stringify({ ...finalFlags, items: finalItems })),
      })
      .eq("session_id", session.id)
      .eq("character_id", selectedCharacter.id);

    // For group/async, advance to next player's turn
    let nextTurnPlayer = session.current_turn_player_id;
    if (session.mode !== "solo" && participants.length > 1) {
      const currentIndex = participants.findIndex(p => p.character?.user_id === user?.id);
      const nextIndex = (currentIndex + 1) % participants.length;
      nextTurnPlayer = participants[nextIndex]?.character?.user_id || null;
    }

    // Update session
    await supabase
      .from("rp_sessions")
      .update({
        current_node_id: choice.target_node_id,
        last_played_at: new Date().toISOString(),
        current_turn_player_id: nextTurnPlayer
      })
      .eq("id", session.id);

    // Add action message for group sessions
    if (session.mode !== "solo") {
      await supabase.from("rp_session_messages").insert({
        session_id: session.id,
        user_id: user?.id,
        message_type: "action",
        content: `${selectedCharacter.name} chose: "${choice.choice_text}"`
      });
    }

    setCharacterProgress({
      ...characterProgress,
      stats_snapshot: newStats,
      xp_earned: (characterProgress?.xp_earned || 0) + xpGained,
      story_flags: { ...finalFlags, items: finalItems },
    });

    // Load next node or end
    if (choice.target_node_id) {
      await loadNode(choice.target_node_id);
    } else {
      // End of story
      await supabase
        .from("rp_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", session.id);

      // Award XP to character
      const totalXp = (characterProgress?.xp_earned || 0) + xpGained + 100;
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

      setSession(prev => prev ? { ...prev, status: "completed" } : null);
    }

    setProcessing(false);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !session || !user) return;

    await supabase.from("rp_session_messages").insert({
      session_id: session.id,
      user_id: user.id,
      message_type: "chat",
      content: chatInput.trim()
    });

    setChatInput("");
  };

  const copySessionCode = () => {
    if (session?.session_code) {
      navigator.clipboard.writeText(session.session_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Check if choice is available (including IP-based path unlocks)
  const canMakeChoice = (choice: RpNodeChoice): { available: boolean; reason?: string } => {
    if (!isMyTurn()) {
      return { available: false, reason: "Wait for your turn" };
    }

    // Check stat requirements
    if (choice.stat_requirement) {
      const stats = characterProgress?.stats_snapshot || selectedCharacter?.stats || {};
      const { stat, min_value } = choice.stat_requirement;
      const currentValue = stats[stat as keyof CharacterStats] || 0;
      
      if (currentValue < min_value) {
        return { 
          available: false, 
          reason: `Requires ${min_value} ${stat} (you have ${currentValue})` 
        };
      }
    }

    // Check IP-based path unlocks (item_requirement field repurposed for ip_requirement)
    if (choice.item_requirement && choice.item_requirement.startsWith("ip:")) {
      const ipReq = choice.item_requirement.replace("ip:", "");
      const [targetCharId, minScoreStr] = ipReq.split(",");
      if (targetCharId && minScoreStr && selectedCharacter) {
        const minScore = parseInt(minScoreStr, 10);
        if (!isNaN(minScore)) {
          // Check if we have sufficient IP with the target character
          const currentFlags = characterProgress?.story_flags || {};
          const ipScores = (currentFlags.ip_scores || {}) as Record<string, number>;
          const currentIP = ipScores[targetCharId] || 0;
          if (currentIP < minScore) {
            const level = getRelationshipLevel(currentIP);
            const requiredLevel = getRelationshipLevel(minScore);
            return {
              available: false,
              reason: `Requires ${RELATIONSHIP_LEVEL_CONFIG[requiredLevel].label} relationship (currently ${RELATIONSHIP_LEVEL_CONFIG[level].label})`,
            };
          }
        }
      }
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

  const isGroupSession = session?.mode !== "solo";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold">{campaign?.title || session?.campaign?.title}</h1>
                  {isGroupSession && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {session?.mode === "async" ? "Async" : "Group"}
                    </Badge>
                  )}
                </div>
                {selectedCharacter && (
                  <p className="text-sm text-muted-foreground">
                    Playing as {selectedCharacter.name}
                    {!isMyTurn() && <span className="text-destructive ml-2">• Waiting for other players...</span>}
                  </p>
                )}
              </div>
            </div>

             <div className="flex items-center gap-2">
              {selectedCharacter && characterProgress && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  +{characterProgress.xp_earned} XP
                </Badge>
              )}
              {triggerLog.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {triggerLog.length}
                </Badge>
              )}
              {isGroupSession && session?.session_code && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowInviteDialog(true)}>
                  <Share2 className="h-4 w-4" />
                  Invite
                </Button>
              )}
              {session && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidePanel(!showSidePanel)}
                >
                  {showSidePanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Story Content */}
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
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
                {choices.length > 0 && session?.status === "active" ? (
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
                ) : currentNode.node_type === "ending" || session?.status === "completed" ? (
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
      </div>

      {/* Side Panel — always available when session is active */}
      {session && showSidePanel && (
        <aside className="w-80 border-l bg-muted/30 flex flex-col">
          <Tabs value={sidePanel} onValueChange={(v) => setSidePanel(v as typeof sidePanel)} className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b flex-wrap h-auto gap-0">
              <TabsTrigger value="milestones" className="flex-1 gap-1 text-xs px-2">
                <Flag className="h-3.5 w-3.5" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="triggers" className="flex-1 gap-1 text-xs px-2">
                <Zap className="h-3.5 w-3.5" />
                Events
                {triggerLog.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5">
                    {triggerLog.length}
                  </span>
                )}
              </TabsTrigger>
              {isGroupSession && (
                <>
                  <TabsTrigger value="party" className="flex-1 gap-1 text-xs px-2">
                    <Users className="h-3.5 w-3.5" />
                    Party
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1 gap-1 text-xs px-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="milestones" className="flex-1 p-4 m-0">
              <KeyPointProgress
                campaignId={activeCampaignId}
                visitedNodeIds={visitedNodeIds}
                storyFlags={characterProgress?.story_flags || {}}
              />
            </TabsContent>

            <TabsContent value="triggers" className="flex-1 p-4 m-0">
              <TriggerLog entries={triggerLog} />
            </TabsContent>

            {isGroupSession && (
              <>
                <TabsContent value="party" className="flex-1 p-4 m-0">
                  <div className="space-y-3">
                    {participants.map((p) => (
                      <Card key={p.id} className={`${p.character?.user_id === session.current_turn_player_id ? "border-primary" : ""}`}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={p.character?.portrait_url || undefined} />
                            <AvatarFallback>{p.character?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{p.character?.name}</p>
                            <p className="text-xs text-muted-foreground">{p.user?.username || "Unknown"}</p>
                          </div>
                          {p.character?.user_id === session.current_turn_player_id && (
                            <Badge variant="default" className="shrink-0">Turn</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {participants.length < (session.max_players || 4) && (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={() => setShowInviteDialog(true)}
                      >
                        <Users className="h-4 w-4" />
                        Invite Players
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`${
                            msg.message_type === "system" 
                              ? "text-center text-xs text-muted-foreground italic" 
                              : msg.message_type === "action"
                              ? "text-center text-sm text-primary italic"
                              : ""
                          }`}
                        >
                          {msg.message_type === "chat" && (
                            <div className="flex gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={msg.user?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {msg.user?.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-xs font-medium">{msg.user?.username}</span>
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            </div>
                          )}
                          {msg.message_type !== "chat" && msg.content}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button size="icon" onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </aside>
      )}

      {/* Character Selection Dialog */}
      <Dialog open={showCharacterSelect} onOpenChange={setShowCharacterSelect}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose Your Character</DialogTitle>
            <DialogDescription>
              Select a character and game mode to begin
            </DialogDescription>
          </DialogHeader>

          {characters.length === 0 ? (
            <div className="text-center py-6">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No characters yet</p>
              <Button onClick={() => navigate('/lore-chronicles/create-character')}>
                Create Character
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {characters.map((char) => (
                  <Card 
                    key={char.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCharacter?.id === char.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedCharacter(char)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={char.portrait_url || undefined} />
                        <AvatarFallback>{char.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{char.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Level {char.level} {char.race?.name || "Unknown Race"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Game Mode</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4"
                    onClick={() => selectedCharacter && startSession(selectedCharacter, "solo")}
                    disabled={!selectedCharacter || processing}
                  >
                    <User className="h-5 w-5 mb-1" />
                    <span className="text-xs">Solo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4"
                    onClick={() => selectedCharacter && startSession(selectedCharacter, "group")}
                    disabled={!selectedCharacter || processing}
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs">Group</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4"
                    onClick={() => selectedCharacter && startSession(selectedCharacter, "async")}
                    disabled={!selectedCharacter || processing}
                  >
                    <Clock className="h-5 w-5 mb-1" />
                    <span className="text-xs">Async</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Players</DialogTitle>
            <DialogDescription>
              Share this code with friends to join your session
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-center">
              <span className="text-2xl font-mono font-bold tracking-widest">
                {session?.session_code}
              </span>
            </div>
            <Button size="icon" variant="outline" onClick={copySessionCode}>
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Up to {(session?.max_players || 4) - participants.length} more players can join
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionPlayer;
