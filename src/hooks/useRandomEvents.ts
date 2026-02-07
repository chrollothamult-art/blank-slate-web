import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type RandomEventCategory =
  | "encounter"
  | "weather"
  | "fortune"
  | "misfortune"
  | "discovery"
  | "ambush";

export interface RandomEvent {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  category: RandomEventCategory;
  probability: number;
  conditions: Record<string, unknown>;
  effects: Record<string, unknown>;
  is_recurring: boolean;
  cooldown_turns: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RandomEventLog {
  id: string;
  session_id: string;
  event_id: string;
  character_id: string | null;
  fired_at: string;
  outcome: Record<string, unknown>;
  was_positive: boolean;
}

export const CATEGORY_LABELS: Record<RandomEventCategory, { label: string; icon: string; color: string }> = {
  encounter: { label: "Encounter", icon: "👤", color: "text-blue-500" },
  weather: { label: "Weather", icon: "🌧️", color: "text-cyan-500" },
  fortune: { label: "Fortune", icon: "✨", color: "text-yellow-500" },
  misfortune: { label: "Misfortune", icon: "💀", color: "text-red-500" },
  discovery: { label: "Discovery", icon: "🔍", color: "text-purple-500" },
  ambush: { label: "Ambush", icon: "⚔️", color: "text-orange-500" },
};

interface SessionState {
  stats: Record<string, number>;
  storyFlags: Record<string, unknown>;
  items?: string[];
  turnCount?: number;
  location?: string;
}

/**
 * Evaluate if a random event's conditions are met
 */
const evaluateEventConditions = (
  conditions: Record<string, unknown>,
  state: SessionState
): boolean => {
  // Empty conditions = always eligible
  if (!conditions || Object.keys(conditions).length === 0) return true;

  // Check stat thresholds
  if (conditions.stat_threshold) {
    const threshold = conditions.stat_threshold as Record<string, number>;
    for (const [stat, minValue] of Object.entries(threshold)) {
      if ((state.stats[stat] || 0) < minValue) return false;
    }
  }

  // Check required flags
  if (conditions.required_flags) {
    const flags = conditions.required_flags as Record<string, unknown>;
    for (const [flag, value] of Object.entries(flags)) {
      if (state.storyFlags[flag] !== value) return false;
    }
  }

  // Check minimum turn count
  if (conditions.min_turns) {
    if ((state.turnCount || 0) < Number(conditions.min_turns)) return false;
  }

  // Check location
  if (conditions.location) {
    if (state.location !== conditions.location) return false;
  }

  return true;
};

/**
 * Roll the dice for a random event
 */
const rollForEvent = (probability: number): boolean => {
  return Math.random() * 100 < probability;
};

export const useRandomEvents = (campaignId: string) => {
  const [events, setEvents] = useState<RandomEvent[]>([]);
  const [eventLog, setEventLog] = useState<RandomEventLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_random_events")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at");

    if (error) {
      console.error("Error fetching random events:", error);
      setLoading(false);
      return;
    }

    const mapped: RandomEvent[] = (data || []).map((e) => ({
      ...e,
      category: e.category as RandomEventCategory,
      conditions: (e.conditions as Record<string, unknown>) || {},
      effects: (e.effects as Record<string, unknown>) || {},
    }));

    setEvents(mapped);
    setLoading(false);
  }, [campaignId]);

  const createEvent = async (
    name: string,
    category: RandomEventCategory,
    probability: number,
    options?: {
      description?: string;
      conditions?: Record<string, unknown>;
      effects?: Record<string, unknown>;
      is_recurring?: boolean;
      cooldown_turns?: number;
    }
  ) => {
    const { data, error } = await supabase
      .from("rp_random_events")
      .insert({
        campaign_id: campaignId,
        name,
        category,
        probability,
        description: options?.description || null,
        conditions: JSON.parse(JSON.stringify(options?.conditions || {})),
        effects: JSON.parse(JSON.stringify(options?.effects || {})),
        is_recurring: options?.is_recurring ?? false,
        cooldown_turns: options?.cooldown_turns ?? 0,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create random event", variant: "destructive" });
      return null;
    }

    toast({ title: "Random event created!" });
    await fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, updates: Partial<RandomEvent>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.probability !== undefined) updateData.probability = updates.probability;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.is_recurring !== undefined) updateData.is_recurring = updates.is_recurring;
    if (updates.cooldown_turns !== undefined) updateData.cooldown_turns = updates.cooldown_turns;
    if (updates.conditions !== undefined) updateData.conditions = JSON.parse(JSON.stringify(updates.conditions));
    if (updates.effects !== undefined) updateData.effects = JSON.parse(JSON.stringify(updates.effects));

    const { error } = await supabase
      .from("rp_random_events")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update event", variant: "destructive" });
      return false;
    }

    await fetchEvents();
    return true;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from("rp_random_events")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete event", variant: "destructive" });
      return false;
    }

    toast({ title: "Event deleted" });
    await fetchEvents();
    return true;
  };

  /**
   * Load the event log for a session
   */
  const loadEventLog = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("rp_random_event_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("fired_at", { ascending: true });

    if (data) {
      setEventLog(
        data.map((e) => ({
          ...e,
          outcome: (e.outcome as Record<string, unknown>) || {},
        }))
      );
    }
  }, []);

  /**
   * Check for random events and potentially fire one
   */
  const checkRandomEvents = useCallback(
    async (
      sessionId: string,
      characterId: string,
      state: SessionState,
      firedEventIds: string[]
    ): Promise<{
      firedEvent: RandomEvent | null;
      effects: Record<string, unknown>;
      message: string | null;
    }> => {
      // Get active events
      const activeEvents = events.filter((e) => e.is_active);

      // Filter out non-recurring events that already fired
      const eligibleEvents = activeEvents.filter((e) => {
        if (!e.is_recurring && firedEventIds.includes(e.id)) return false;
        
        // Check cooldown for recurring events
        if (e.is_recurring && e.cooldown_turns > 0) {
          const lastFired = eventLog.find((log) => log.event_id === e.id);
          if (lastFired) {
            // Simple cooldown check based on log entries
            const recentFirings = eventLog.filter(
              (log) => log.event_id === e.id
            ).length;
            // This is simplified - real implementation would check turn count
            if (recentFirings > 0) return false;
          }
        }

        return evaluateEventConditions(e.conditions, state);
      });

      // Roll for each eligible event
      for (const event of eligibleEvents) {
        if (rollForEvent(event.probability)) {
          // Log the event
          await supabase.from("rp_random_event_log").insert({
            session_id: sessionId,
            event_id: event.id,
            character_id: characterId,
            outcome: JSON.parse(JSON.stringify(event.effects)),
            was_positive: event.category === "fortune" || event.category === "discovery",
          });

          return {
            firedEvent: event,
            effects: event.effects,
            message: event.description || event.name,
          };
        }
      }

      return { firedEvent: null, effects: {}, message: null };
    },
    [events, eventLog]
  );

  return {
    events,
    eventLog,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEventLog,
    checkRandomEvents,
  };
};
