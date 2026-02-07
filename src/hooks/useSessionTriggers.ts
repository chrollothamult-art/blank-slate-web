import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TriggerType, EventType } from "@/hooks/useEventTriggers";

export interface FiredTrigger {
  id: string;
  trigger_id: string;
  trigger_name: string;
  trigger_type: TriggerType;
  event_name: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  fired_at: string;
}

export interface TriggerLogEntry {
  id: string;
  session_id: string;
  trigger_id: string;
  character_id: string;
  fired_at: string;
  context: Record<string, unknown>;
}

interface TriggerDefinition {
  id: string;
  name: string;
  trigger_type: TriggerType;
  conditions: Record<string, unknown>;
  is_active: boolean;
  events: Array<{
    id: string;
    name: string;
    event_type: EventType;
    payload: Record<string, unknown>;
  }>;
}

interface SessionState {
  stats: Record<string, number>;
  storyFlags: Record<string, unknown>;
  items?: string[];
  nodeId?: string;
  playerCount?: number;
}

/**
 * Evaluates a single trigger condition against the current session state.
 */
const evaluateTriggerCondition = (
  triggerType: TriggerType,
  conditions: Record<string, unknown>,
  state: SessionState
): boolean => {
  switch (triggerType) {
    case "stat_threshold": {
      const stat = conditions.stat as string;
      const minValue = Number(conditions.min_value) || 0;
      const currentValue = state.stats[stat] || 0;
      return currentValue >= minValue;
    }
    case "item_possessed": {
      const itemName = (conditions.item_name as string)?.toLowerCase();
      return (state.items || []).some((i) => i.toLowerCase() === itemName);
    }
    case "flag_set": {
      const flagName = conditions.flag_name as string;
      const flagValue = conditions.flag_value;
      const currentValue = state.storyFlags[flagName];
      if (flagValue === "true") return currentValue === true;
      if (flagValue === "false") return currentValue === false;
      return String(currentValue) === String(flagValue);
    }
    case "relationship_score": {
      const npcName = conditions.npc_name as string;
      const minScore = Number(conditions.min_score) || 0;
      const currentScore = Number(state.storyFlags[`relationship_${npcName}`]) || 0;
      return currentScore >= minScore;
    }
    case "faction_reputation": {
      const factionName = conditions.faction_name as string;
      const minRep = Number(conditions.min_reputation) || 0;
      const currentRep = Number(state.storyFlags[`faction_${factionName}`]) || 0;
      return currentRep >= minRep;
    }
    case "choice_made": {
      const choiceNodeId = conditions.node_id as string;
      const choiceText = (conditions.choice_text as string)?.toLowerCase();
      const madeChoices = (state.storyFlags.choices_made || []) as Array<{
        node_id: string;
        choice_text: string;
      }>;
      return madeChoices.some(
        (c) =>
          c.node_id === choiceNodeId &&
          c.choice_text?.toLowerCase().includes(choiceText)
      );
    }
    case "player_count": {
      const minPlayers = Number(conditions.min_players) || 1;
      return (state.playerCount || 1) >= minPlayers;
    }
    case "random_chance": {
      const probability = Number(conditions.probability) || 0;
      return Math.random() * 100 < probability;
    }
    default:
      return false;
  }
};

/**
 * Applies the effects of a triggered event to the session state.
 * Returns a partial state update.
 */
const applyEventEffect = (
  eventType: EventType,
  payload: Record<string, unknown>,
  state: SessionState
): Partial<SessionState> => {
  switch (eventType) {
    case "modify_stat": {
      const stat = payload.stat as string;
      const change = Number(payload.change) || 0;
      const newStats = { ...state.stats };
      newStats[stat] = Math.max(1, Math.min(10, (newStats[stat] || 0) + change));
      return { stats: newStats };
    }
    case "set_flag": {
      const flagName = payload.flag_name as string;
      let flagValue: unknown = payload.flag_value;
      if (flagValue === "true") flagValue = true;
      if (flagValue === "false") flagValue = false;
      return {
        storyFlags: { ...state.storyFlags, [flagName]: flagValue },
      };
    }
    case "grant_item": {
      const itemName = payload.item_name as string;
      return {
        items: [...(state.items || []), itemName],
      };
    }
    case "award_xp": {
      // XP is handled externally by the session player
      return {};
    }
    case "show_message":
    case "unlock_path":
    case "spawn_node":
      // These are handled by the UI layer
      return {};
    default:
      return {};
  }
};

export const useSessionTriggers = (campaignId: string) => {
  const [triggers, setTriggers] = useState<TriggerDefinition[]>([]);
  const [triggerLog, setTriggerLog] = useState<FiredTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load all active triggers and their events for this campaign.
   */
  const loadTriggers = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data: triggerData } = await supabase
      .from("rp_event_triggers")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_active", true);

    if (!triggerData || triggerData.length === 0) {
      setTriggers([]);
      setLoading(false);
      return;
    }

    const triggerIds = triggerData.map((t) => t.id);
    const { data: eventData } = await supabase
      .from("rp_triggered_events")
      .select("*")
      .in("trigger_id", triggerIds);

    const mapped: TriggerDefinition[] = triggerData.map((t) => ({
      id: t.id,
      name: t.name,
      trigger_type: t.trigger_type as TriggerType,
      conditions: (t.conditions as Record<string, unknown>) || {},
      is_active: t.is_active,
      events: (eventData || [])
        .filter((e) => e.trigger_id === t.id)
        .map((e) => ({
          id: e.id,
          name: e.name,
          event_type: e.event_type as EventType,
          payload: (e.payload as Record<string, unknown>) || {},
        })),
    }));

    setTriggers(mapped);
    setLoading(false);
  }, [campaignId]);

  /**
   * Load the trigger log for a session.
   */
  const loadTriggerLog = useCallback(
    async (sessionId: string) => {
      const { data } = await supabase
        .from("rp_session_trigger_log")
        .select("*")
        .eq("session_id", sessionId)
        .order("fired_at", { ascending: true });

      if (data) {
        // Map to FiredTrigger by looking up trigger/event info
        const entries: FiredTrigger[] = [];
        for (const entry of data) {
          const trigger = triggers.find((t) => t.id === entry.trigger_id);
          if (trigger) {
            const context = (entry.context as Record<string, unknown>) || {};
            entries.push({
              id: entry.id,
              trigger_id: trigger.id,
              trigger_name: trigger.name,
              trigger_type: trigger.trigger_type,
              event_name: (context.event_name as string) || trigger.name,
              event_type: (context.event_type as EventType) || "show_message",
              payload: (context.payload as Record<string, unknown>) || {},
              fired_at: entry.fired_at,
            });
          }
        }
        setTriggerLog(entries);
      }
    },
    [triggers]
  );

  /**
   * Evaluate all triggers against current state.
   * Returns fired triggers with their effects and any messages to display.
   */
  const evaluateTriggers = useCallback(
    async (
      sessionId: string,
      characterId: string,
      state: SessionState,
      alreadyFiredIds: string[]
    ): Promise<{
      firedTriggers: FiredTrigger[];
      stateUpdates: Partial<SessionState>;
      messages: string[];
      xpAwarded: number;
    }> => {
      const firedTriggers: FiredTrigger[] = [];
      let stateUpdates: Partial<SessionState> = {};
      const messages: string[] = [];
      let xpAwarded = 0;

      for (const trigger of triggers) {
        // Skip already-fired triggers (one-time)
        if (alreadyFiredIds.includes(trigger.id)) continue;

        const isMet = evaluateTriggerCondition(
          trigger.trigger_type,
          trigger.conditions,
          state
        );

        if (!isMet) continue;

        // Fire all events for this trigger
        for (const event of trigger.events) {
          const effect = applyEventEffect(event.event_type, event.payload, {
            ...state,
            ...stateUpdates,
          });
          stateUpdates = { ...stateUpdates, ...effect };

          if (event.event_type === "show_message" && event.payload.message) {
            messages.push(event.payload.message as string);
          }

          if (event.event_type === "award_xp") {
            xpAwarded += Number(event.payload.amount) || 0;
          }

          firedTriggers.push({
            id: crypto.randomUUID(),
            trigger_id: trigger.id,
            trigger_name: trigger.name,
            trigger_type: trigger.trigger_type,
            event_name: event.name,
            event_type: event.event_type,
            payload: event.payload,
            fired_at: new Date().toISOString(),
          });
        }

        // Log the trigger firing
        await supabase.from("rp_session_trigger_log").insert([{
          session_id: sessionId,
          trigger_id: trigger.id,
          character_id: characterId,
          context: JSON.parse(JSON.stringify({
            event_name: trigger.events[0]?.name,
            event_type: trigger.events[0]?.event_type,
            payload: trigger.events[0]?.payload,
            conditions_met: trigger.conditions,
          })),
        }]);
      }

      // Update local trigger log
      setTriggerLog((prev) => [...prev, ...firedTriggers]);

      return { firedTriggers, stateUpdates, messages, xpAwarded };
    },
    [triggers]
  );

  return {
    triggers,
    triggerLog,
    loading,
    loadTriggers,
    loadTriggerLog,
    evaluateTriggers,
  };
};
