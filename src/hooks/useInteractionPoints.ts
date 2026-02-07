import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type InteractionType =
  | "dialogue"
  | "trade"
  | "combat"
  | "persuasion"
  | "alliance"
  | "betrayal";

export type OutcomeResult = "good" | "bad" | "neutral";

export interface InteractionPoint {
  id: string;
  campaign_id: string;
  node_id: string | null;
  name: string;
  interaction_type: InteractionType;
  description: string | null;
  participants: Array<{ type: string; npc_id?: string; npc_name?: string }>;
  stat_requirements: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  outcomes?: InteractionOutcome[];
}

export interface InteractionOutcome {
  id: string;
  interaction_id: string;
  participant_role: string;
  result_type: OutcomeResult;
  condition: Record<string, unknown>;
  stat_effects: Record<string, number>;
  flag_effects: Record<string, unknown>;
  reputation_effects: Record<string, number>;
  narrative_text: string | null;
  target_node_id: string | null;
  created_at: string;
}

export interface InteractionLog {
  id: string;
  session_id: string;
  interaction_id: string;
  participants: Array<{ character_id: string; role: string }>;
  outcome_id: string | null;
  context: Record<string, unknown>;
  occurred_at: string;
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, { label: string; icon: string; color: string }> = {
  dialogue: { label: "Dialogue", icon: "💬", color: "text-blue-500" },
  trade: { label: "Trade", icon: "🤝", color: "text-green-500" },
  combat: { label: "Combat", icon: "⚔️", color: "text-red-500" },
  persuasion: { label: "Persuasion", icon: "🎭", color: "text-purple-500" },
  alliance: { label: "Alliance", icon: "🛡️", color: "text-cyan-500" },
  betrayal: { label: "Betrayal", icon: "🗡️", color: "text-orange-500" },
};

export const useInteractionPoints = (campaignId: string) => {
  const [interactions, setInteractions] = useState<InteractionPoint[]>([]);
  const [interactionLog, setInteractionLog] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data: interactionData, error } = await supabase
      .from("rp_interaction_points")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at");

    if (error) {
      console.error("Error fetching interactions:", error);
      setLoading(false);
      return;
    }

    // Fetch outcomes for each interaction
    const interactionIds = (interactionData || []).map((i) => i.id);
    let outcomesData: InteractionOutcome[] = [];

    if (interactionIds.length > 0) {
      const { data } = await supabase
        .from("rp_interaction_outcomes")
        .select("*")
        .in("interaction_id", interactionIds);

      outcomesData = (data || []).map((o) => ({
        ...o,
        result_type: o.result_type as OutcomeResult,
        condition: (o.condition as Record<string, unknown>) || {},
        stat_effects: (o.stat_effects as Record<string, number>) || {},
        flag_effects: (o.flag_effects as Record<string, unknown>) || {},
        reputation_effects: (o.reputation_effects as Record<string, number>) || {},
      }));
    }

    const mapped: InteractionPoint[] = (interactionData || []).map((i) => ({
      ...i,
      interaction_type: i.interaction_type as InteractionType,
      participants: (i.participants as Array<{ type: string; npc_id?: string; npc_name?: string }>) || [],
      stat_requirements: (i.stat_requirements as Record<string, number>) || {},
      outcomes: outcomesData.filter((o) => o.interaction_id === i.id),
    }));

    setInteractions(mapped);
    setLoading(false);
  }, [campaignId]);

  const createInteraction = async (
    name: string,
    interactionType: InteractionType,
    options?: {
      node_id?: string;
      description?: string;
      participants?: Array<{ type: string; npc_id?: string; npc_name?: string }>;
      stat_requirements?: Record<string, number>;
    }
  ) => {
    const { data, error } = await supabase
      .from("rp_interaction_points")
      .insert({
        campaign_id: campaignId,
        name,
        interaction_type: interactionType,
        node_id: options?.node_id || null,
        description: options?.description || null,
        participants: JSON.parse(JSON.stringify(options?.participants || [])),
        stat_requirements: JSON.parse(JSON.stringify(options?.stat_requirements || {})),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create interaction", variant: "destructive" });
      return null;
    }

    toast({ title: "Interaction created!" });
    await fetchInteractions();
    return data;
  };

  const updateInteraction = async (id: string, updates: Partial<InteractionPoint>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.interaction_type !== undefined) updateData.interaction_type = updates.interaction_type;
    if (updates.node_id !== undefined) updateData.node_id = updates.node_id;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.participants !== undefined) updateData.participants = JSON.parse(JSON.stringify(updates.participants));
    if (updates.stat_requirements !== undefined) updateData.stat_requirements = JSON.parse(JSON.stringify(updates.stat_requirements));

    const { error } = await supabase
      .from("rp_interaction_points")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update interaction", variant: "destructive" });
      return false;
    }

    await fetchInteractions();
    return true;
  };

  const deleteInteraction = async (id: string) => {
    const { error } = await supabase
      .from("rp_interaction_points")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete interaction", variant: "destructive" });
      return false;
    }

    toast({ title: "Interaction deleted" });
    await fetchInteractions();
    return true;
  };

  const createOutcome = async (
    interactionId: string,
    resultType: OutcomeResult,
    participantRole: string,
    options?: {
      condition?: Record<string, unknown>;
      stat_effects?: Record<string, number>;
      flag_effects?: Record<string, unknown>;
      reputation_effects?: Record<string, number>;
      narrative_text?: string;
      target_node_id?: string;
    }
  ) => {
    const { error } = await supabase.from("rp_interaction_outcomes").insert({
      interaction_id: interactionId,
      result_type: resultType,
      participant_role: participantRole,
      condition: JSON.parse(JSON.stringify(options?.condition || {})),
      stat_effects: JSON.parse(JSON.stringify(options?.stat_effects || {})),
      flag_effects: JSON.parse(JSON.stringify(options?.flag_effects || {})),
      reputation_effects: JSON.parse(JSON.stringify(options?.reputation_effects || {})),
      narrative_text: options?.narrative_text || null,
      target_node_id: options?.target_node_id || null,
    });

    if (error) {
      toast({ title: "Failed to create outcome", variant: "destructive" });
      return false;
    }

    toast({ title: "Outcome added!" });
    await fetchInteractions();
    return true;
  };

  const deleteOutcome = async (outcomeId: string) => {
    const { error } = await supabase
      .from("rp_interaction_outcomes")
      .delete()
      .eq("id", outcomeId);

    if (error) {
      toast({ title: "Failed to delete outcome", variant: "destructive" });
      return false;
    }

    await fetchInteractions();
    return true;
  };

  /**
   * Load interaction log for a session
   */
  const loadInteractionLog = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("rp_interaction_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("occurred_at", { ascending: true });

    if (data) {
      setInteractionLog(
        data.map((l) => ({
          ...l,
          participants: (l.participants as Array<{ character_id: string; role: string }>) || [],
          context: (l.context as Record<string, unknown>) || {},
        }))
      );
    }
  }, []);

  /**
   * Execute an interaction and log the result
   */
  const executeInteraction = async (
    sessionId: string,
    interactionId: string,
    participants: Array<{ character_id: string; role: string }>,
    outcomeId: string,
    context?: Record<string, unknown>
  ) => {
    const { error } = await supabase.from("rp_interaction_log").insert({
      session_id: sessionId,
      interaction_id: interactionId,
      participants: JSON.parse(JSON.stringify(participants)),
      outcome_id: outcomeId,
      context: JSON.parse(JSON.stringify(context || {})),
    });

    if (error) {
      toast({ title: "Failed to log interaction", variant: "destructive" });
      return false;
    }

    return true;
  };

  /**
   * Find the appropriate outcome based on conditions
   */
  const resolveOutcome = (
    interaction: InteractionPoint,
    characterStats: Record<string, number>,
    storyFlags: Record<string, unknown>
  ): InteractionOutcome | null => {
    if (!interaction.outcomes || interaction.outcomes.length === 0) return null;

    // Check stat requirements
    let meetsRequirements = true;
    for (const [stat, minValue] of Object.entries(interaction.stat_requirements)) {
      if ((characterStats[stat] || 0) < minValue) {
        meetsRequirements = false;
        break;
      }
    }

    // Find matching outcome
    for (const outcome of interaction.outcomes) {
      // Check outcome-specific conditions
      const conditions = outcome.condition;
      let conditionsMet = true;

      if (conditions.requires_stat_check && !meetsRequirements) {
        conditionsMet = false;
      }

      if (conditions.required_flags) {
        const flags = conditions.required_flags as Record<string, unknown>;
        for (const [flag, value] of Object.entries(flags)) {
          if (storyFlags[flag] !== value) {
            conditionsMet = false;
            break;
          }
        }
      }

      // Return based on whether requirements were met
      if (meetsRequirements && outcome.result_type === "good" && conditionsMet) {
        return outcome;
      }
      if (!meetsRequirements && outcome.result_type === "bad" && conditionsMet) {
        return outcome;
      }
    }

    // Return neutral outcome if available
    return interaction.outcomes.find((o) => o.result_type === "neutral") || null;
  };

  return {
    interactions,
    interactionLog,
    loading,
    fetchInteractions,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    createOutcome,
    deleteOutcome,
    loadInteractionLog,
    executeInteraction,
    resolveOutcome,
  };
};
