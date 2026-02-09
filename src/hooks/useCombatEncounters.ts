import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type CombatType = "pvp" | "pve" | "duel";
export type CombatStatus = "pending" | "active" | "resolved";
export type BluffType = "flex" | "feign_weakness" | "scout" | "intimidate";

export interface CombatParticipant {
  character_id: string;
  role: "attacker" | "defender" | "challenger" | "participant";
  visible_equipment: string[];
  is_ready?: boolean;
}

export interface CombatEncounter {
  id: string;
  session_id: string;
  node_id: string | null;
  combat_type: CombatType;
  participants: CombatParticipant[];
  stats_hidden: boolean;
  status: CombatStatus;
  outcome: {
    winner_id?: string;
    loser_id?: string;
    type?: "knockout" | "death" | "surrender" | "escape";
    damage_dealt?: Record<string, number>;
  } | null;
  started_at: string;
  resolved_at: string | null;
}

export interface BluffAttempt {
  id: string;
  session_id: string;
  actor_id: string;
  target_id: string;
  attempt_type: BluffType;
  stat_used: string;
  roll_value: number;
  difficulty: number;
  success: boolean;
  revealed_info: {
    stat?: string;
    hint?: string;
    actual_value?: number;
  } | null;
  created_at: string;
}

// Stat hints based on relative strength
const STAT_HINTS: Record<string, { low: string; mid: string; high: string }> = {
  strength: { low: "appears frail", mid: "seems capable", high: "looks powerful" },
  agility: { low: "moves clumsily", mid: "moves steadily", high: "moves like lightning" },
  magic: { low: "no magical aura", mid: "faint magical presence", high: "radiates power" },
  charisma: { low: "unremarkable presence", mid: "noticeable presence", high: "commanding presence" },
  wisdom: { low: "seems naive", mid: "appears observant", high: "deeply perceptive" },
  endurance: { low: "looks weary", mid: "seems hardy", high: "built to last" },
};

export const getStatHint = (stat: string, value: number): string => {
  const hints = STAT_HINTS[stat.toLowerCase()];
  if (!hints) return "unknown";
  if (value <= 3) return hints.low;
  if (value <= 6) return hints.mid;
  return hints.high;
};

export const useCombatEncounters = (sessionId: string) => {
  const [encounters, setEncounters] = useState<CombatEncounter[]>([]);
  const [bluffHistory, setBluffHistory] = useState<BluffAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncounters = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_combat_encounters")
      .select("*")
      .eq("session_id", sessionId)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error fetching encounters:", error);
      setLoading(false);
      return;
    }

    setEncounters((data || []).map(e => ({
      ...e,
      combat_type: e.combat_type as CombatType,
      status: e.status as CombatStatus,
      participants: (e.participants as unknown as CombatParticipant[]) || [],
      outcome: e.outcome as CombatEncounter["outcome"],
    })));
    setLoading(false);
  }, [sessionId]);

  const fetchBluffHistory = useCallback(async (characterId: string) => {
    if (!sessionId) return;

    const { data } = await supabase
      .from("rp_bluff_attempts")
      .select("*")
      .eq("session_id", sessionId)
      .or(`actor_id.eq.${characterId},target_id.eq.${characterId}`)
      .order("created_at", { ascending: false });

    setBluffHistory((data || []).map(b => ({
      ...b,
      attempt_type: b.attempt_type as BluffType,
      revealed_info: b.revealed_info as BluffAttempt["revealed_info"],
    })));
  }, [sessionId]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  /**
   * Initiate a new combat encounter
   */
  const startCombat = async (
    combatType: CombatType,
    participants: CombatParticipant[],
    options?: { node_id?: string; stats_hidden?: boolean }
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from("rp_combat_encounters")
      .insert({
        session_id: sessionId,
        combat_type: combatType,
        participants: JSON.parse(JSON.stringify(participants)),
        node_id: options?.node_id || null,
        stats_hidden: options?.stats_hidden ?? true,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to start combat", variant: "destructive" });
      return null;
    }

    toast({ title: "Combat initiated!" });
    await fetchEncounters();
    return data.id;
  };

  /**
   * Update combat status
   */
  const updateCombatStatus = async (encounterId: string, status: CombatStatus) => {
    const updateData: Record<string, unknown> = { status };
    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("rp_combat_encounters")
      .update(updateData)
      .eq("id", encounterId);

    if (error) {
      toast({ title: "Failed to update combat", variant: "destructive" });
      return false;
    }

    await fetchEncounters();
    return true;
  };

  /**
   * Resolve combat with outcome
   */
  const resolveCombat = async (
    encounterId: string,
    outcome: CombatEncounter["outcome"]
  ) => {
    const { error } = await supabase
      .from("rp_combat_encounters")
      .update({
        status: "resolved",
        outcome: JSON.parse(JSON.stringify(outcome)),
        resolved_at: new Date().toISOString(),
      })
      .eq("id", encounterId);

    if (error) {
      toast({ title: "Failed to resolve combat", variant: "destructive" });
      return false;
    }

    toast({ title: "Combat resolved!" });
    await fetchEncounters();
    return true;
  };

  /**
   * Attempt a bluff action (flex, feign weakness, scout, intimidate)
   */
  const attemptBluff = async (
    actorId: string,
    targetId: string,
    attemptType: BluffType,
    actorStats: Record<string, number>,
    targetStats: Record<string, number>
  ): Promise<BluffAttempt | null> => {
    // Determine which stat to use based on bluff type
    let statUsed: string;
    let difficulty: number;
    let revealedStat: string | undefined;

    switch (attemptType) {
      case "flex":
        statUsed = "charisma";
        difficulty = 5;
        break;
      case "feign_weakness":
        statUsed = "charisma";
        difficulty = 6;
        break;
      case "scout":
        statUsed = "perception";
        difficulty = targetStats.stealth || 5;
        revealedStat = ["strength", "agility", "magic"][Math.floor(Math.random() * 3)];
        break;
      case "intimidate":
        statUsed = "charisma";
        difficulty = targetStats.wisdom || 5;
        break;
      default:
        statUsed = "charisma";
        difficulty = 5;
    }

    // Roll check
    const rollValue = (actorStats[statUsed] || 3) + Math.floor(Math.random() * 6) + 1;
    const success = rollValue >= difficulty;

    // Determine revealed info for scouting
    let revealedInfo: BluffAttempt["revealed_info"] = null;
    if (success && attemptType === "scout" && revealedStat) {
      const targetValue = targetStats[revealedStat] || 0;
      revealedInfo = {
        stat: revealedStat,
        hint: getStatHint(revealedStat, targetValue),
      };
    }

    const { data, error } = await supabase
      .from("rp_bluff_attempts")
      .insert({
        session_id: sessionId,
        actor_id: actorId,
        target_id: targetId,
        attempt_type: attemptType,
        stat_used: statUsed,
        roll_value: rollValue,
        difficulty,
        success,
        revealed_info: revealedInfo ? JSON.parse(JSON.stringify(revealedInfo)) : null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to record bluff attempt", variant: "destructive" });
      return null;
    }

    toast({
      title: success ? "Bluff successful!" : "Bluff failed",
      description: success && revealedInfo?.hint 
        ? `They ${revealedInfo.hint}` 
        : undefined,
    });

    return {
      ...data,
      attempt_type: data.attempt_type as BluffType,
      revealed_info: data.revealed_info as BluffAttempt["revealed_info"],
    };
  };

  /**
   * Get active combat for the session
   */
  const getActiveCombat = (): CombatEncounter | null => {
    return encounters.find(e => e.status === "active") || null;
  };

  /**
   * Check if character is in active combat
   */
  const isInCombat = (characterId: string): boolean => {
    const active = getActiveCombat();
    if (!active) return false;
    return active.participants.some(p => p.character_id === characterId);
  };

  return {
    encounters,
    bluffHistory,
    loading,
    fetchEncounters,
    fetchBluffHistory,
    startCombat,
    updateCombatStatus,
    resolveCombat,
    attemptBluff,
    getActiveCombat,
    isInCombat,
  };
};
