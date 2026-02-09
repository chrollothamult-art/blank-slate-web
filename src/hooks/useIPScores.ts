import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Relationship levels based on IP score thresholds
export type RelationshipLevel =
  | "blood_feud"   // -100 to -75
  | "hostile"      // -74 to -50
  | "distrustful"  // -49 to -25
  | "neutral"      // -24 to +24
  | "friendly"     // +25 to +49
  | "bonded"       // +50 to +74
  | "sworn";       // +75 to +100

export interface CharacterIPScore {
  id: string;
  session_id: string;
  character_a_id: string;
  character_b_id: string;
  score: number;
  relationship_level: RelationshipLevel;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  character_a?: { id: string; name: string; portrait_url: string | null };
  character_b?: { id: string; name: string; portrait_url: string | null };
}

export interface IPChangeHistory {
  id: string;
  session_id: string;
  character_a_id: string;
  character_b_id: string;
  change_amount: number;
  new_score: number;
  old_level: string;
  new_level: string;
  reason: string;
  source_action_id: string | null;
  created_at: string;
}

export interface IPThresholdEvent {
  id: string;
  campaign_id: string;
  name: string;
  threshold_min: number;
  threshold_max: number;
  event_type: "forced_choice" | "alliance" | "duel" | "bonus" | "penalty" | "unlock_path";
  event_payload: Record<string, unknown>;
  target_node_id: string | null;
  is_mandatory: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// IP change reasons with their default values
export const IP_CHANGE_VALUES: Record<string, number> = {
  helped_in_combat: 15,
  shared_item: 10,
  lied_undiscovered: -5,
  lie_discovered: -20,
  stole_from: -25,
  saved_life: 30,
  betrayed: -50,
  whispered_secret_low: 5,
  whispered_secret_high: 15,
  compliment: 3,
  insult: -5,
  offered_food: 5,
  attacked: -30,
  healed: 10,
  protected: 20,
};

export const RELATIONSHIP_LEVEL_CONFIG: Record<RelationshipLevel, { 
  label: string; 
  color: string; 
  minScore: number; 
  maxScore: number;
  description: string;
}> = {
  blood_feud: { 
    label: "Blood Feud", 
    color: "text-red-700 bg-red-100", 
    minScore: -100, 
    maxScore: -75,
    description: "Mortal enemies. Forced confrontations may occur." 
  },
  hostile: { 
    label: "Hostile", 
    color: "text-red-500 bg-red-50", 
    minScore: -74, 
    maxScore: -50,
    description: "Kill-or-be-killed scenarios become available." 
  },
  distrustful: { 
    label: "Distrustful", 
    color: "text-orange-500 bg-orange-50", 
    minScore: -49, 
    maxScore: -25,
    description: "Perception bonus against them. Limited cooperation." 
  },
  neutral: { 
    label: "Neutral", 
    color: "text-gray-500 bg-gray-50", 
    minScore: -24, 
    maxScore: 24,
    description: "Standard interactions available." 
  },
  friendly: { 
    label: "Friendly", 
    color: "text-green-500 bg-green-50", 
    minScore: 25, 
    maxScore: 49,
    description: "Share hints, cooperative bonuses." 
  },
  bonded: { 
    label: "Bonded", 
    color: "text-blue-500 bg-blue-50", 
    minScore: 50, 
    maxScore: 74,
    description: "Duo abilities unlocked. Shared quests." 
  },
  sworn: { 
    label: "Sworn", 
    color: "text-purple-500 bg-purple-100", 
    minScore: 75, 
    maxScore: 100,
    description: "Unbreakable alliance. Sacrifice events. Combined stat checks." 
  },
};

export const getRelationshipLevel = (score: number): RelationshipLevel => {
  if (score <= -75) return "blood_feud";
  if (score <= -50) return "hostile";
  if (score <= -25) return "distrustful";
  if (score <= 24) return "neutral";
  if (score <= 49) return "friendly";
  if (score <= 74) return "bonded";
  return "sworn";
};

export const useIPScores = (sessionId: string) => {
  const [scores, setScores] = useState<CharacterIPScore[]>([]);
  const [history, setHistory] = useState<IPChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_character_ip_scores")
      .select(`
        *,
        character_a:rp_characters!rp_character_ip_scores_character_a_id_fkey(id, name, portrait_url),
        character_b:rp_characters!rp_character_ip_scores_character_b_id_fkey(id, name, portrait_url)
      `)
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error fetching IP scores:", error);
      setLoading(false);
      return;
    }

    setScores((data || []).map(s => ({
      ...s,
      relationship_level: s.relationship_level as RelationshipLevel,
    })));
    setLoading(false);
  }, [sessionId]);

  const fetchHistory = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from("rp_ip_change_history")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50);

    setHistory(data || []);
  }, [sessionId]);

  useEffect(() => {
    fetchScores();
    fetchHistory();
  }, [fetchScores, fetchHistory]);

  /**
   * Get IP score between two characters (order-agnostic)
   */
  const getScore = (charAId: string, charBId: string): CharacterIPScore | null => {
    return scores.find(
      s => 
        (s.character_a_id === charAId && s.character_b_id === charBId) ||
        (s.character_a_id === charBId && s.character_b_id === charAId)
    ) || null;
  };

  /**
   * Adjust IP score between two characters
   */
  const adjustIP = async (
    characterAId: string,
    characterBId: string,
    changeAmount: number,
    reason: string,
    sourceActionId?: string
  ): Promise<boolean> => {
    // Ensure consistent ordering (smaller UUID first)
    const [charA, charB] = characterAId < characterBId 
      ? [characterAId, characterBId] 
      : [characterBId, characterAId];

    const existing = getScore(charA, charB);
    const oldScore = existing?.score || 0;
    const newScore = Math.max(-100, Math.min(100, oldScore + changeAmount));
    const oldLevel = getRelationshipLevel(oldScore);
    const newLevel = getRelationshipLevel(newScore);

    if (existing) {
      // Update existing score
      const { error } = await supabase
        .from("rp_character_ip_scores")
        .update({
          score: newScore,
          relationship_level: newLevel,
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Failed to update IP score", variant: "destructive" });
        return false;
      }
    } else {
      // Create new score
      const { error } = await supabase
        .from("rp_character_ip_scores")
        .insert({
          session_id: sessionId,
          character_a_id: charA,
          character_b_id: charB,
          score: newScore,
          relationship_level: newLevel,
          last_interaction_at: new Date().toISOString(),
        });

      if (error) {
        toast({ title: "Failed to create IP score", variant: "destructive" });
        return false;
      }
    }

    // Log the change
    await supabase.from("rp_ip_change_history").insert({
      session_id: sessionId,
      character_a_id: charA,
      character_b_id: charB,
      change_amount: changeAmount,
      new_score: newScore,
      old_level: oldLevel,
      new_level: newLevel,
      reason,
      source_action_id: sourceActionId || null,
    });

    // Notify if level changed
    if (oldLevel !== newLevel) {
      const levelConfig = RELATIONSHIP_LEVEL_CONFIG[newLevel];
      toast({
        title: `Relationship Changed: ${levelConfig.label}`,
        description: levelConfig.description,
      });
    }

    await fetchScores();
    await fetchHistory();
    return true;
  };

  /**
   * Get all relationships for a specific character
   */
  const getCharacterRelationships = (characterId: string): CharacterIPScore[] => {
    return scores.filter(
      s => s.character_a_id === characterId || s.character_b_id === characterId
    );
  };

  /**
   * Check if two characters are in a specific relationship level or better
   */
  const hasRelationshipLevel = (
    charAId: string,
    charBId: string,
    minLevel: RelationshipLevel
  ): boolean => {
    const score = getScore(charAId, charBId);
    if (!score) return minLevel === "neutral";
    
    const minConfig = RELATIONSHIP_LEVEL_CONFIG[minLevel];
    return score.score >= minConfig.minScore;
  };

  return {
    scores,
    history,
    loading,
    fetchScores,
    fetchHistory,
    getScore,
    adjustIP,
    getCharacterRelationships,
    hasRelationshipLevel,
  };
};

/**
 * Hook for managing IP threshold events (campaign creator tool)
 */
export const useIPThresholdEvents = (campaignId: string) => {
  const [events, setEvents] = useState<IPThresholdEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_ip_threshold_events")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("threshold_min");

    if (error) {
      console.error("Error fetching IP events:", error);
      setLoading(false);
      return;
    }

    setEvents((data || []).map(e => ({
      ...e,
      event_type: e.event_type as IPThresholdEvent["event_type"],
      event_payload: (e.event_payload as Record<string, unknown>) || {},
    })));
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (
    name: string,
    thresholdMin: number,
    thresholdMax: number,
    eventType: IPThresholdEvent["event_type"],
    options?: {
      description?: string;
      event_payload?: Record<string, unknown>;
      target_node_id?: string;
      is_mandatory?: boolean;
    }
  ) => {
    const { error } = await supabase.from("rp_ip_threshold_events").insert([{
      campaign_id: campaignId,
      name,
      threshold_min: thresholdMin,
      threshold_max: thresholdMax,
      event_type: eventType,
      description: options?.description || null,
      event_payload: options?.event_payload || {},
      target_node_id: options?.target_node_id || null,
      is_mandatory: options?.is_mandatory || false,
    }] as never);

    if (error) {
      toast({ title: "Failed to create IP event", variant: "destructive" });
      return false;
    }

    toast({ title: "IP threshold event created!" });
    await fetchEvents();
    return true;
  };

  const updateEvent = async (id: string, updates: Partial<IPThresholdEvent>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.threshold_min !== undefined) updateData.threshold_min = updates.threshold_min;
    if (updates.threshold_max !== undefined) updateData.threshold_max = updates.threshold_max;
    if (updates.event_type !== undefined) updateData.event_type = updates.event_type;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.event_payload !== undefined) updateData.event_payload = updates.event_payload;
    if (updates.target_node_id !== undefined) updateData.target_node_id = updates.target_node_id;
    if (updates.is_mandatory !== undefined) updateData.is_mandatory = updates.is_mandatory;

    const { error } = await supabase
      .from("rp_ip_threshold_events")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update IP event", variant: "destructive" });
      return false;
    }

    await fetchEvents();
    return true;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from("rp_ip_threshold_events")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete IP event", variant: "destructive" });
      return false;
    }

    toast({ title: "IP event deleted" });
    await fetchEvents();
    return true;
  };

  /**
   * Find events that should trigger for a given score
   */
  const getTriggeredEvents = (score: number): IPThresholdEvent[] => {
    return events.filter(e => score >= e.threshold_min && score <= e.threshold_max);
  };

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getTriggeredEvents,
  };
};
