import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ProximityZone = "far" | "mid" | "close" | "adjacent";

export interface PlayerPosition {
  id: string;
  session_id: string;
  character_id: string;
  zone: ProximityZone;
  relative_to_character_id: string | null;
  scene_node_id: string | null;
  position_x: number;
  position_y: number;
  updated_at: string;
  character?: {
    id: string;
    name: string;
    portrait_url: string | null;
    user_id: string;
  };
}

export interface PreparedAction {
  id: string;
  session_id: string;
  character_id: string;
  action_type: string;
  target_character_id: string | null;
  item_id: string | null;
  preparation: Record<string, unknown>;
  is_revealed: boolean;
  is_used: boolean;
  prepared_at: string;
  cooldown_until: string | null;
}

export interface ActionDefinition {
  id: string;
  campaign_id: string;
  name: string;
  action_type: string;
  category: string | null;
  description: string | null;
  required_range: ProximityZone | "any";
  required_item: string | null;
  required_stat: string | null;
  required_stat_value: number;
  is_detectable: boolean;
  detection_difficulty: number;
  success_effect: Record<string, unknown>;
  failure_effect: Record<string, unknown>;
  cooldown_turns: number;
  is_enabled: boolean;
}

export interface PvPSettings {
  id: string;
  campaign_id: string;
  pvp_enabled: boolean;
  lethality_mode: "no-kill" | "wound-only" | "permadeath";
  friendly_fire: boolean;
  require_consent: boolean;
  pvp_zones_only: boolean;
}

export interface ActionLogEntry {
  id: string;
  session_id: string;
  actor_id: string;
  target_id: string | null;
  action_type: string;
  action_category: string | null;
  stat_check_result: Record<string, unknown> | null;
  was_detected: boolean;
  outcome: Record<string, unknown>;
  witnesses: string[];
  executed_at: string;
}

// Zone distances (in "paces")
export const ZONE_DISTANCES: Record<ProximityZone, { min: number; max: number; label: string }> = {
  far: { min: 10, max: 999, label: "10+ paces" },
  mid: { min: 3, max: 9, label: "3-9 paces" },
  close: { min: 1, max: 2, label: "1-2 paces" },
  adjacent: { min: 0, max: 0, label: "Touching" },
};

// Movement actions available
export const MOVEMENT_ACTIONS = [
  { id: "stop", label: "Stop", description: "Stay in place" },
  { id: "walk", label: "Walk", description: "Move slowly (1 zone closer/farther)" },
  { id: "run", label: "Run", description: "Move quickly (2 zones)" },
  { id: "approach", label: "Approach", description: "Move toward a specific player" },
  { id: "retreat", label: "Retreat", description: "Move away from a specific player" },
  { id: "circle", label: "Circle", description: "Move around without changing distance" },
];

export const usePlayerPositions = (sessionId: string, campaignId: string) => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<PlayerPosition[]>([]);
  const [preparedActions, setPreparedActions] = useState<PreparedAction[]>([]);
  const [actionDefinitions, setActionDefinitions] = useState<ActionDefinition[]>([]);
  const [pvpSettings, setPvpSettings] = useState<PvPSettings | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);

  // Load positions for session
  const loadPositions = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from("rp_player_positions")
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error loading positions:", error);
      return;
    }

    // Fetch characters separately to avoid relation ambiguity
    const characterIds = [...new Set((data || []).map((p) => p.character_id))];
    const { data: characters } = await supabase
      .from("rp_characters")
      .select("id, name, portrait_url, user_id")
      .in("id", characterIds);

    const charMap = new Map(characters?.map((c) => [c.id, c]) || []);

    setPositions(
      (data || []).map((p) => ({
        ...p,
        zone: p.zone as ProximityZone,
        character: charMap.get(p.character_id) as PlayerPosition["character"],
      }))
    );
  }, [sessionId]);

  // Load prepared actions for my character
  const loadPreparedActions = useCallback(async () => {
    if (!sessionId || !myCharacterId) return;

    const { data, error } = await supabase
      .from("rp_prepared_actions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("character_id", myCharacterId)
      .eq("is_used", false);

    if (error) {
      console.error("Error loading prepared actions:", error);
      return;
    }

    setPreparedActions(
      (data || []).map((a) => ({
        ...a,
        preparation: (a.preparation || {}) as Record<string, unknown>,
      }))
    );
  }, [sessionId, myCharacterId]);

  // Load campaign action definitions
  const loadActionDefinitions = useCallback(async () => {
    if (!campaignId) return;

    const { data, error } = await supabase
      .from("rp_action_definitions")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_enabled", true);

    if (error) {
      console.error("Error loading action definitions:", error);
      return;
    }

    setActionDefinitions(
      (data || []).map((d) => ({
        ...d,
        required_range: d.required_range as ActionDefinition["required_range"],
        success_effect: (d.success_effect || {}) as Record<string, unknown>,
        failure_effect: (d.failure_effect || {}) as Record<string, unknown>,
      }))
    );
  }, [campaignId]);

  // Load PvP settings
  const loadPvpSettings = useCallback(async () => {
    if (!campaignId) return;

    const { data } = await supabase
      .from("rp_pvp_settings")
      .select("*")
      .eq("campaign_id", campaignId)
      .single();

    if (data) {
      setPvpSettings({
        ...data,
        lethality_mode: data.lethality_mode as PvPSettings["lethality_mode"],
      });
    }
  }, [campaignId]);

  // Load action log
  const loadActionLog = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from("rp_action_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("executed_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading action log:", error);
      return;
    }

    setActionLog(
      (data || []).map((l) => ({
        ...l,
        stat_check_result: l.stat_check_result as Record<string, unknown> | null,
        outcome: (l.outcome || {}) as Record<string, unknown>,
        witnesses: ((l.witnesses || []) as unknown as string[]),
      }))
    );
  }, [sessionId]);

  // Initialize position for character in session
  const initializePosition = async (characterId: string, nodeId?: string) => {
    if (!sessionId) return;

    const { data: existing } = await supabase
      .from("rp_player_positions")
      .select("id")
      .eq("session_id", sessionId)
      .eq("character_id", characterId)
      .maybeSingle();

    if (existing) return; // Already has position

    const { error } = await supabase.from("rp_player_positions").insert({
      session_id: sessionId,
      character_id: characterId,
      scene_node_id: nodeId || null,
      zone: "far",
    });

    if (error) {
      console.error("Error initializing position:", error);
    }

    await loadPositions();
  };

  // Move closer or farther from another character
  const moveToward = async (targetCharacterId: string, direction: "closer" | "farther") => {
    if (!sessionId || !myCharacterId) return false;

    // Find current position relative to target
    const currentPos = positions.find(
      (p) => p.character_id === myCharacterId && p.relative_to_character_id === targetCharacterId
    );

    const zones: ProximityZone[] = ["adjacent", "close", "mid", "far"];
    const currentIdx = currentPos ? zones.indexOf(currentPos.zone) : 3; // Default to far

    let newZone: ProximityZone;
    if (direction === "closer") {
      newZone = zones[Math.max(0, currentIdx - 1)];
    } else {
      newZone = zones[Math.min(3, currentIdx + 1)];
    }

    // Upsert position
    const { error } = await supabase.from("rp_player_positions").upsert(
      {
        session_id: sessionId,
        character_id: myCharacterId,
        relative_to_character_id: targetCharacterId,
        zone: newZone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,character_id,relative_to_character_id" }
    );

    if (error) {
      toast({ title: "Failed to move", variant: "destructive" });
      return false;
    }

    toast({ title: `Moved ${direction} — now at ${ZONE_DISTANCES[newZone].label}` });
    await loadPositions();
    return true;
  };

  // Set zone directly
  const setZone = async (targetCharacterId: string, zone: ProximityZone) => {
    if (!sessionId || !myCharacterId) return false;

    const { error } = await supabase.from("rp_player_positions").upsert(
      {
        session_id: sessionId,
        character_id: myCharacterId,
        relative_to_character_id: targetCharacterId,
        zone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,character_id,relative_to_character_id" }
    );

    if (error) {
      toast({ title: "Failed to set position", variant: "destructive" });
      return false;
    }

    await loadPositions();
    return true;
  };

  // Prepare an action (hidden until executed or detected)
  const prepareAction = async (
    actionType: string,
    targetCharacterId?: string,
    itemId?: string,
    preparation?: Record<string, unknown>
  ) => {
    if (!sessionId || !myCharacterId) return null;

    const { data, error } = await supabase
      .from("rp_prepared_actions")
      .insert([{
        session_id: sessionId,
        character_id: myCharacterId,
        action_type: actionType,
        target_character_id: targetCharacterId || null,
        item_id: itemId || null,
        preparation: (preparation || {}) as unknown as Record<string, never>,
      }])
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to prepare action", variant: "destructive" });
      return null;
    }

    toast({ title: "Action prepared", description: `${actionType} is ready` });
    await loadPreparedActions();
    return data;
  };

  // Execute a prepared action
  const executeAction = async (preparedActionId: string) => {
    if (!sessionId || !myCharacterId) return false;

    const prepared = preparedActions.find((a) => a.id === preparedActionId);
    if (!prepared) return false;

    // Mark as used
    await supabase
      .from("rp_prepared_actions")
      .update({ is_used: true, is_revealed: true })
      .eq("id", preparedActionId);

    // Log the action
    const { error } = await supabase.from("rp_action_log").insert({
      session_id: sessionId,
      actor_id: myCharacterId,
      target_id: prepared.target_character_id,
      action_type: prepared.action_type,
      outcome: { executed: true },
    });

    if (error) {
      console.error("Error logging action:", error);
    }

    toast({ title: "Action executed!" });
    await loadPreparedActions();
    await loadActionLog();
    return true;
  };

  // Cancel a prepared action
  const cancelPreparedAction = async (preparedActionId: string) => {
    const { error } = await supabase
      .from("rp_prepared_actions")
      .delete()
      .eq("id", preparedActionId);

    if (error) {
      toast({ title: "Failed to cancel", variant: "destructive" });
      return false;
    }

    await loadPreparedActions();
    return true;
  };

  // Check if action is available based on range and requirements
  const isActionAvailable = (
    action: ActionDefinition,
    targetCharacterId: string,
    characterStats?: Record<string, number>,
    inventory?: string[]
  ): { available: boolean; reason?: string } => {
    // Check range
    if (action.required_range !== "any") {
      const pos = positions.find(
        (p) => p.character_id === myCharacterId && p.relative_to_character_id === targetCharacterId
      );
      const currentZone = pos?.zone || "far";
      const zones: ProximityZone[] = ["adjacent", "close", "mid", "far"];
      const requiredIdx = zones.indexOf(action.required_range);
      const currentIdx = zones.indexOf(currentZone);

      if (currentIdx > requiredIdx) {
        return { available: false, reason: `Requires ${action.required_range} range` };
      }
    }

    // Check required item
    if (action.required_item && inventory && !inventory.includes(action.required_item)) {
      return { available: false, reason: `Requires ${action.required_item}` };
    }

    // Check required stat
    if (action.required_stat && characterStats) {
      const statValue = characterStats[action.required_stat] || 0;
      if (statValue < action.required_stat_value) {
        return {
          available: false,
          reason: `Requires ${action.required_stat} ≥ ${action.required_stat_value}`,
        };
      }
    }

    return { available: true };
  };

  // Get my character ID from session participants
  useEffect(() => {
    const getMyCharacter = async () => {
      if (!sessionId || !user) return;

      const { data } = await supabase
        .from("rp_session_participants")
        .select("character_id, character:rp_characters(user_id)")
        .eq("session_id", sessionId);

      const myParticipant = data?.find(
        (p) => (p.character as { user_id: string })?.user_id === user.id
      );

      if (myParticipant) {
        setMyCharacterId(myParticipant.character_id);
      }
    };

    getMyCharacter();
  }, [sessionId, user]);

  // Load all data
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadPositions(),
        loadActionDefinitions(),
        loadPvpSettings(),
        loadActionLog(),
      ]);
      setLoading(false);
    };

    if (sessionId && campaignId) {
      loadAll();
    }
  }, [sessionId, campaignId, loadPositions, loadActionDefinitions, loadPvpSettings, loadActionLog]);

  // Load prepared actions when character is known
  useEffect(() => {
    if (myCharacterId) {
      loadPreparedActions();
    }
  }, [myCharacterId, loadPreparedActions]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`positions-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rp_player_positions", filter: `session_id=eq.${sessionId}` },
        () => {
          loadPositions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rp_action_log", filter: `session_id=eq.${sessionId}` },
        () => {
          loadActionLog();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, loadPositions, loadActionLog]);

  return {
    positions,
    preparedActions,
    actionDefinitions,
    pvpSettings,
    actionLog,
    loading,
    myCharacterId,
    initializePosition,
    moveToward,
    setZone,
    prepareAction,
    executeAction,
    cancelPreparedAction,
    isActionAvailable,
    refetch: loadPositions,
  };
};
