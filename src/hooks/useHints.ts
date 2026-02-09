import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HintType = "direction" | "action" | "social" | "discovery" | "warning";
export type SourceFlavor = "inner_voice" | "companion_whisper" | "environmental_clue" | "divine_sign";
export type HintResponse = "followed" | "ignored" | "opposite";

export interface Hint {
  id: string;
  campaign_id: string;
  node_id: string | null;
  hint_type: HintType;
  hint_text: string;
  conditions: Record<string, unknown>;
  follow_outcome: Record<string, unknown>;
  ignore_outcome: Record<string, unknown>;
  opposite_outcome: Record<string, unknown>;
  is_red_herring: boolean;
  source_flavor: SourceFlavor;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface HintResponseRecord {
  id: string;
  session_id: string;
  hint_id: string;
  character_id: string;
  response: HintResponse;
  triggered_event_id: string | null;
  context: Record<string, unknown>;
  responded_at: string;
}

export interface HintChain {
  id: string;
  campaign_id: string;
  chain_name: string;
  hint_ids: string[];
  completion_reward: Record<string, unknown>;
  chain_order: number;
}

/**
 * Hook to manage hints for campaigns — creation, evaluation, and response tracking.
 */
export const useHints = (campaignId: string) => {
  const [hints, setHints] = useState<Hint[]>([]);
  const [hintChains, setHintChains] = useState<HintChain[]>([]);
  const [responses, setResponses] = useState<HintResponseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHints = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_hints" as any)
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (!error && data) {
      setHints(
        (data as any[]).map((h) => ({
          ...h,
          conditions: (h.conditions as Record<string, unknown>) || {},
          follow_outcome: (h.follow_outcome as Record<string, unknown>) || {},
          ignore_outcome: (h.ignore_outcome as Record<string, unknown>) || {},
          opposite_outcome: (h.opposite_outcome as Record<string, unknown>) || {},
          hint_ids: [],
        }))
      );
    }
    setLoading(false);
  }, [campaignId]);

  const fetchHintChains = useCallback(async () => {
    if (!campaignId) return;

    const { data } = await supabase
      .from("rp_hint_chains" as any)
      .select("*")
      .eq("campaign_id", campaignId)
      .order("chain_order");

    if (data) {
      setHintChains(
        (data as any[]).map((c) => ({
          ...c,
          hint_ids: (c.hint_ids as string[]) || [],
          completion_reward: (c.completion_reward as Record<string, unknown>) || {},
        }))
      );
    }
  }, [campaignId]);

  const fetchResponses = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("rp_hint_responses" as any)
      .select("*")
      .eq("session_id", sessionId)
      .order("responded_at");

    if (data) {
      setResponses(
        (data as any[]).map((r) => ({
          ...r,
          context: (r.context as Record<string, unknown>) || {},
        }))
      );
    }
  }, []);

  /**
   * Create a new hint
   */
  const createHint = async (hint: {
    node_id?: string;
    hint_type: HintType;
    hint_text: string;
    conditions?: Record<string, unknown>;
    follow_outcome?: Record<string, unknown>;
    ignore_outcome?: Record<string, unknown>;
    opposite_outcome?: Record<string, unknown>;
    is_red_herring?: boolean;
    source_flavor?: SourceFlavor;
    priority?: number;
  }) => {
    const { data, error } = await supabase
      .from("rp_hints" as any)
      .insert({
        campaign_id: campaignId,
        node_id: hint.node_id || null,
        hint_type: hint.hint_type,
        hint_text: hint.hint_text,
        conditions: JSON.parse(JSON.stringify(hint.conditions || {})),
        follow_outcome: JSON.parse(JSON.stringify(hint.follow_outcome || {})),
        ignore_outcome: JSON.parse(JSON.stringify(hint.ignore_outcome || {})),
        opposite_outcome: JSON.parse(JSON.stringify(hint.opposite_outcome || {})),
        is_red_herring: hint.is_red_herring || false,
        source_flavor: hint.source_flavor || "inner_voice",
        priority: hint.priority || 0,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating hint:", error);
      return null;
    }

    await fetchHints();
    return data;
  };

  /**
   * Delete a hint
   */
  const deleteHint = async (hintId: string) => {
    const { error } = await supabase
      .from("rp_hints" as any)
      .delete()
      .eq("id", hintId);

    if (error) {
      console.error("Error deleting hint:", error);
      return false;
    }

    await fetchHints();
    return true;
  };

  /**
   * Create a hint chain
   */
  const createHintChain = async (chainName: string, hintIds: string[], completionReward?: Record<string, unknown>) => {
    const { error } = await supabase
      .from("rp_hint_chains" as any)
      .insert({
        campaign_id: campaignId,
        chain_name: chainName,
        hint_ids: JSON.parse(JSON.stringify(hintIds)),
        completion_reward: JSON.parse(JSON.stringify(completionReward || {})),
        chain_order: hintChains.length,
      } as any);

    if (error) {
      console.error("Error creating hint chain:", error);
      return false;
    }

    await fetchHintChains();
    return true;
  };

  const deleteHintChain = async (chainId: string) => {
    const { error } = await supabase
      .from("rp_hint_chains" as any)
      .delete()
      .eq("id", chainId);

    if (!error) await fetchHintChains();
    return !error;
  };

  /**
   * Evaluate which hints should show for a player at a given node, given their state
   */
  const getActiveHints = useCallback(
    (
      nodeId: string,
      playerState: {
        stats?: Record<string, number>;
        flags?: Record<string, unknown>;
        inventory?: string[];
      }
    ): Hint[] => {
      return hints.filter((hint) => {
        // Must be for this node or global (no node)
        if (hint.node_id && hint.node_id !== nodeId) return false;

        const cond = hint.conditions;
        if (!cond || Object.keys(cond).length === 0) return true;

        // Check stat conditions
        if (cond.stat_threshold && playerState.stats) {
          const stat = cond.stat_threshold as { stat: string; min_value: number };
          if ((playerState.stats[stat.stat] || 0) < stat.min_value) return false;
        }

        // Check flag conditions
        if (cond.flag_required && playerState.flags) {
          const flag = cond.flag_required as { key: string; value: unknown };
          if (playerState.flags[flag.key] !== flag.value) return false;
        }

        // Check item conditions
        if (cond.item_required && playerState.inventory) {
          const item = cond.item_required as string;
          if (!playerState.inventory.includes(item)) return false;
        }

        return true;
      });
    },
    [hints]
  );

  /**
   * Record a player's response to a hint
   */
  const recordHintResponse = async (
    sessionId: string,
    hintId: string,
    characterId: string,
    response: HintResponse
  ) => {
    const hint = hints.find((h) => h.id === hintId);
    const outcome =
      response === "followed"
        ? hint?.follow_outcome
        : response === "opposite"
        ? hint?.opposite_outcome
        : hint?.ignore_outcome;

    const { error } = await supabase.from("rp_hint_responses" as any).insert({
      session_id: sessionId,
      hint_id: hintId,
      character_id: characterId,
      response,
      context: JSON.parse(JSON.stringify({ outcome: outcome || {}, is_red_herring: hint?.is_red_herring })),
    } as any);

    if (!error) await fetchResponses(sessionId);

    return { error: error || null, outcome: outcome || {} };
  };

  /**
   * Get hint streak stats for random event integration
   */
  const getHintStreaks = useCallback((): {
    followStreak: number;
    ignoreStreak: number;
    oppositeCount: number;
  } => {
    let followStreak = 0;
    let ignoreStreak = 0;
    let oppositeCount = 0;

    // Count from most recent
    for (let i = responses.length - 1; i >= 0; i--) {
      const r = responses[i];
      if (r.response === "opposite") oppositeCount++;
      if (i === responses.length - 1 || followStreak > 0) {
        if (r.response === "followed") followStreak++;
        else break;
      }
    }
    // Reset and count ignore streak
    for (let i = responses.length - 1; i >= 0; i--) {
      if (responses[i].response === "ignored") ignoreStreak++;
      else break;
    }

    return { followStreak, ignoreStreak, oppositeCount };
  }, [responses]);

  return {
    hints,
    hintChains,
    responses,
    loading,
    fetchHints,
    fetchHintChains,
    fetchResponses,
    createHint,
    deleteHint,
    createHintChain,
    deleteHintChain,
    getActiveHints,
    recordHintResponse,
    getHintStreaks,
  };
};
