import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface SessionParticipant {
  id: string;
  character_id: string;
  is_active: boolean;
  joined_at: string;
  character?: {
    id: string;
    name: string;
    portrait_url: string | null;
    level: number;
    user_id: string;
  };
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

interface SessionState {
  id: string;
  current_node_id: string | null;
  current_turn_player_id: string | null;
  turn_order: string[] | null;
  status: string;
  story_flags: Record<string, unknown>;
}

interface PresenceState {
  [key: string]: {
    user_id: string;
    username: string;
    character_id?: string;
    online_at: string;
  }[];
}

export const useRealtimeSession = (sessionId: string | null) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch initial session and participants data
  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from("rp_sessions")
      .select("id, current_node_id, current_turn_player_id, turn_order, status, story_flags")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      setLoading(false);
      return;
    }

    setSessionState({
      ...session,
      story_flags: (session.story_flags as Record<string, unknown>) || {}
    });

    // Fetch participants with character info
    const { data: participantsData, error: participantsError } = await supabase
      .from("rp_session_participants")
      .select(`
        id,
        character_id,
        is_active,
        joined_at,
        character:rp_characters(id, name, portrait_url, level, user_id)
      `)
      .eq("session_id", sessionId);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      setLoading(false);
      return;
    }

    // Fetch user profiles for participants
    const userIds = [...new Set((participantsData || [])
      .map(p => (p.character as { user_id: string } | null)?.user_id)
      .filter(Boolean))] as string[];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profilesMap = new Map(
      (profiles || []).map(p => [p.id, { username: p.username, avatar_url: p.avatar_url }])
    );

    const mapped: SessionParticipant[] = (participantsData || []).map(p => {
      const char = p.character as { id: string; name: string; portrait_url: string | null; level: number; user_id: string } | null;
      return {
        id: p.id,
        character_id: p.character_id,
        is_active: p.is_active,
        joined_at: p.joined_at,
        character: char || undefined,
        user: char?.user_id ? profilesMap.get(char.user_id) : undefined
      };
    });

    setParticipants(mapped);
    setLoading(false);
  }, [sessionId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!sessionId || !user) return;

    fetchSessionData();

    // Create channel for this session
    const realtimeChannel = supabase.channel(`session:${sessionId}`, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    // Listen for session updates
    realtimeChannel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rp_sessions",
          filter: `id=eq.${sessionId}`
        },
        (payload: RealtimePostgresChangesPayload<{
          id: string;
          current_node_id: string | null;
          current_turn_player_id: string | null;
          turn_order: string[] | null;
          status: string;
          story_flags: Record<string, unknown>;
        }>) => {
          const newData = payload.new;
          if (newData && typeof newData === 'object' && 'id' in newData) {
            setSessionState({
              id: newData.id,
              current_node_id: newData.current_node_id,
              current_turn_player_id: newData.current_turn_player_id,
              turn_order: newData.turn_order,
              status: newData.status,
              story_flags: (newData.story_flags as Record<string, unknown>) || {}
            });
          }
        }
      )
      // Listen for participant changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rp_session_participants",
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          // Refetch all participants on any change
          fetchSessionData();
        }
      )
      // Track presence
      .on("presence", { event: "sync" }, () => {
        const state = realtimeChannel.presenceState() as PresenceState;
        const online = Object.values(state)
          .flat()
          .map(p => p.user_id);
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track this user's presence
          await realtimeChannel.track({
            user_id: user.id,
            username: user.email?.split("@")[0] || "Player",
            online_at: new Date().toISOString()
          });
        }
      });

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [sessionId, user, fetchSessionData]);

  // Update session node (when making a choice)
  const updateCurrentNode = useCallback(async (nodeId: string) => {
    if (!sessionId) return false;

    const { error } = await supabase
      .from("rp_sessions")
      .update({
        current_node_id: nodeId,
        last_played_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    return !error;
  }, [sessionId]);

  // Advance turn to next player
  const advanceTurn = useCallback(async () => {
    if (!sessionId || !sessionState?.turn_order) return false;

    const currentIndex = sessionState.turn_order.findIndex(
      id => id === sessionState.current_turn_player_id
    );
    const nextIndex = (currentIndex + 1) % sessionState.turn_order.length;
    const nextPlayerId = sessionState.turn_order[nextIndex];

    const { error } = await supabase
      .from("rp_sessions")
      .update({
        current_turn_player_id: nextPlayerId,
        last_played_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    return !error;
  }, [sessionId, sessionState]);

  // Check if it's the current user's turn
  const isMyTurn = useCallback((characterId: string) => {
    if (!sessionState?.turn_order || sessionState.turn_order.length === 0) {
      return true; // Solo mode or no turn order
    }
    
    const myParticipant = participants.find(p => p.character_id === characterId);
    if (!myParticipant) return false;

    return sessionState.current_turn_player_id === myParticipant.character?.user_id;
  }, [sessionState, participants]);

  // Get current turn character name
  const getCurrentTurnPlayerName = useCallback(() => {
    if (!sessionState?.current_turn_player_id) return null;
    
    const participant = participants.find(
      p => p.character?.user_id === sessionState.current_turn_player_id
    );
    
    return participant?.character?.name || participant?.user?.username || "Unknown";
  }, [sessionState, participants]);

  return {
    participants,
    sessionState,
    onlineUsers,
    loading,
    isMyTurn,
    getCurrentTurnPlayerName,
    updateCurrentNode,
    advanceTurn,
    refetch: fetchSessionData
  };
};
