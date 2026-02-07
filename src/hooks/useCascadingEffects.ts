import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CascadeRule {
  id: string;
  campaign_id: string;
  source_interaction_id: string;
  source_outcome_type: "good" | "bad" | "neutral";
  target_interaction_id: string;
  effect_type: "unlock" | "lock" | "modify_difficulty" | "change_outcome";
  effect_value: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface CascadeLog {
  id: string;
  session_id: string;
  character_id: string;
  cascade_rule_id: string;
  applied_at: string;
  context: Record<string, unknown>;
}

/**
 * Hook to manage cascading effects between interactions.
 * When one interaction's outcome occurs, it can unlock, lock, or modify future interactions.
 */
export const useCascadingEffects = (campaignId: string) => {
  const [cascadeRules, setCascadeRules] = useState<CascadeRule[]>([]);
  const [appliedCascades, setAppliedCascades] = useState<CascadeLog[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch all cascade rules for a campaign
   */
  const fetchCascadeRules = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_cascade_rules")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)
      .order("priority");

    if (error) {
      console.error("Error fetching cascade rules:", error);
      setLoading(false);
      return;
    }

    setCascadeRules(
      (data || []).map((r) => ({
        ...r,
        source_outcome_type: r.source_outcome_type as "good" | "bad" | "neutral",
        effect_type: r.effect_type as CascadeRule["effect_type"],
        effect_value: (r.effect_value as Record<string, unknown>) || {},
      }))
    );
    setLoading(false);
  }, [campaignId]);

  /**
   * Load applied cascades for a session
   */
  const loadAppliedCascades = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("rp_cascade_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("applied_at");

    if (data) {
      setAppliedCascades(
        data.map((l) => ({
          ...l,
          context: (l.context as Record<string, unknown>) || {},
        }))
      );
    }
  }, []);

  /**
   * Create a new cascade rule
   */
  const createCascadeRule = async (
    sourceInteractionId: string,
    sourceOutcomeType: "good" | "bad" | "neutral",
    targetInteractionId: string,
    effectType: CascadeRule["effect_type"],
    effectValue?: Record<string, unknown>,
    priority?: number
  ) => {
    const { data, error } = await supabase
      .from("rp_cascade_rules")
      .insert({
        campaign_id: campaignId,
        source_interaction_id: sourceInteractionId,
        source_outcome_type: sourceOutcomeType,
        target_interaction_id: targetInteractionId,
        effect_type: effectType,
        effect_value: JSON.parse(JSON.stringify(effectValue || {})),
        priority: priority || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating cascade rule:", error);
      return null;
    }

    await fetchCascadeRules();
    return data;
  };

  /**
   * Delete a cascade rule
   */
  const deleteCascadeRule = async (ruleId: string) => {
    const { error } = await supabase
      .from("rp_cascade_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      console.error("Error deleting cascade rule:", error);
      return false;
    }

    await fetchCascadeRules();
    return true;
  };

  /**
   * Check which interactions are affected by prior outcomes
   */
  const getInteractionEffects = useCallback(
    (
      interactionId: string,
      completedInteractions: Array<{ interaction_id: string; outcome_type: string }>
    ): {
      isLocked: boolean;
      isUnlocked: boolean;
      difficultyModifier: number;
      outcomeModifier: string | null;
    } => {
      let isLocked = false;
      let isUnlocked = false;
      let difficultyModifier = 0;
      let outcomeModifier: string | null = null;

      // Find rules that target this interaction
      const relevantRules = cascadeRules.filter(
        (r) => r.target_interaction_id === interactionId
      );

      for (const rule of relevantRules) {
        // Check if the source interaction was completed with matching outcome
        const sourceCompleted = completedInteractions.find(
          (c) =>
            c.interaction_id === rule.source_interaction_id &&
            c.outcome_type === rule.source_outcome_type
        );

        if (!sourceCompleted) continue;

        switch (rule.effect_type) {
          case "lock":
            isLocked = true;
            break;
          case "unlock":
            isUnlocked = true;
            break;
          case "modify_difficulty":
            difficultyModifier += (rule.effect_value.modifier as number) || 0;
            break;
          case "change_outcome":
            outcomeModifier = (rule.effect_value.force_outcome as string) || null;
            break;
        }
      }

      return { isLocked, isUnlocked, difficultyModifier, outcomeModifier };
    },
    [cascadeRules]
  );

  /**
   * Apply cascade effects after an interaction completes
   */
  const applyCascadeEffects = async (
    sessionId: string,
    characterId: string,
    interactionId: string,
    outcomeType: "good" | "bad" | "neutral"
  ) => {
    // Find rules triggered by this interaction outcome
    const triggeredRules = cascadeRules.filter(
      (r) =>
        r.source_interaction_id === interactionId &&
        r.source_outcome_type === outcomeType
    );

    const appliedRuleIds: string[] = [];

    for (const rule of triggeredRules) {
      // Log the cascade application
      const { error } = await supabase.from("rp_cascade_log").insert({
        session_id: sessionId,
        character_id: characterId,
        cascade_rule_id: rule.id,
        context: {
          source_interaction_id: interactionId,
          outcome_type: outcomeType,
          effect_type: rule.effect_type,
          target_interaction_id: rule.target_interaction_id,
        },
      });

      if (!error) {
        appliedRuleIds.push(rule.id);
      }
    }

    // Refresh applied cascades
    await loadAppliedCascades(sessionId);

    return appliedRuleIds;
  };

  /**
   * Get a summary of cascade effects for display
   */
  const getCascadeEffectsSummary = (interactionId: string): string[] => {
    const effects: string[] = [];
    
    // Rules where this interaction is the source
    const outgoingRules = cascadeRules.filter(
      (r) => r.source_interaction_id === interactionId
    );

    for (const rule of outgoingRules) {
      const outcomeLabel = rule.source_outcome_type === "good" ? "success" : 
                          rule.source_outcome_type === "bad" ? "failure" : "neutral outcome";
      
      switch (rule.effect_type) {
        case "unlock":
          effects.push(`On ${outcomeLabel}: Unlocks a new interaction`);
          break;
        case "lock":
          effects.push(`On ${outcomeLabel}: Locks a future interaction`);
          break;
        case "modify_difficulty":
          const mod = (rule.effect_value.modifier as number) || 0;
          effects.push(`On ${outcomeLabel}: ${mod > 0 ? "Increases" : "Decreases"} difficulty of related interaction`);
          break;
        case "change_outcome":
          effects.push(`On ${outcomeLabel}: Forces a specific outcome in related interaction`);
          break;
      }
    }

    return effects;
  };

  return {
    cascadeRules,
    appliedCascades,
    loading,
    fetchCascadeRules,
    loadAppliedCascades,
    createCascadeRule,
    deleteCascadeRule,
    getInteractionEffects,
    applyCascadeEffects,
    getCascadeEffectsSummary,
  };
};
