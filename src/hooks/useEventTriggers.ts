import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type TriggerType =
  | "stat_threshold"
  | "item_possessed"
  | "flag_set"
  | "relationship_score"
  | "faction_reputation"
  | "choice_made"
  | "player_count"
  | "random_chance";

export type EventType =
  | "unlock_path"
  | "spawn_node"
  | "modify_stat"
  | "grant_item"
  | "set_flag"
  | "show_message"
  | "award_xp";

export interface EventTrigger {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  trigger_type: TriggerType;
  conditions: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  events?: TriggeredEvent[];
}

export interface TriggeredEvent {
  id: string;
  campaign_id: string;
  trigger_id: string;
  name: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export const TRIGGER_TYPE_LABELS: Record<TriggerType, { label: string; description: string }> = {
  stat_threshold: { label: "Stat Threshold", description: "Fires when a character stat meets a threshold" },
  item_possessed: { label: "Item Possessed", description: "Fires when a character has a specific item" },
  flag_set: { label: "Flag Set", description: "Fires when a story flag is set to a value" },
  relationship_score: { label: "Relationship Score", description: "Fires when NPC relationship score meets threshold" },
  faction_reputation: { label: "Faction Reputation", description: "Fires when faction reputation meets threshold" },
  choice_made: { label: "Choice Made", description: "Fires when a specific choice was selected" },
  player_count: { label: "Player Count", description: "Fires when session has enough players" },
  random_chance: { label: "Random Chance", description: "Fires with a random probability" },
};

export const EVENT_TYPE_LABELS: Record<EventType, { label: string; description: string }> = {
  unlock_path: { label: "Unlock Path", description: "Makes a hidden choice or path available" },
  spawn_node: { label: "Spawn Node", description: "Creates a new encounter or story beat" },
  modify_stat: { label: "Modify Stat", description: "Changes a character stat" },
  grant_item: { label: "Grant Item", description: "Gives an item to the character" },
  set_flag: { label: "Set Flag", description: "Sets a story flag" },
  show_message: { label: "Show Message", description: "Displays a message to the player" },
  award_xp: { label: "Award XP", description: "Gives experience points" },
};

export const useEventTriggers = (campaignId: string) => {
  const [triggers, setTriggers] = useState<EventTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTriggers = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data: triggerData, error } = await supabase
      .from("rp_event_triggers")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at");

    if (error) {
      console.error("Error fetching triggers:", error);
      setLoading(false);
      return;
    }

    // Fetch events for each trigger
    const triggerIds = (triggerData || []).map((t) => t.id);
    let eventsData: TriggeredEvent[] = [];
    
    if (triggerIds.length > 0) {
      const { data } = await supabase
        .from("rp_triggered_events")
        .select("*")
        .in("trigger_id", triggerIds);

      eventsData = (data || []).map((e) => ({
        ...e,
        event_type: e.event_type as EventType,
        payload: (e.payload as Record<string, unknown>) || {},
      }));
    }

    const mapped: EventTrigger[] = (triggerData || []).map((t) => ({
      ...t,
      trigger_type: t.trigger_type as TriggerType,
      conditions: (t.conditions as Record<string, unknown>) || {},
      events: eventsData.filter((e) => e.trigger_id === t.id),
    }));

    setTriggers(mapped);
    setLoading(false);
  }, [campaignId]);

  const createTrigger = async (
    name: string,
    triggerType: TriggerType,
    conditions: Record<string, unknown>,
    description?: string
  ) => {
    const { data, error } = await supabase
      .from("rp_event_triggers")
      .insert({
        campaign_id: campaignId,
        name,
        trigger_type: triggerType,
        conditions: JSON.parse(JSON.stringify(conditions)),
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create trigger", variant: "destructive" });
      return null;
    }

    toast({ title: "Trigger created!" });
    await fetchTriggers();
    return data;
  };

  const updateTrigger = async (id: string, updates: Partial<EventTrigger>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.conditions !== undefined) updateData.conditions = JSON.parse(JSON.stringify(updates.conditions));

    const { error } = await supabase
      .from("rp_event_triggers")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update trigger", variant: "destructive" });
      return false;
    }

    await fetchTriggers();
    return true;
  };

  const deleteTrigger = async (id: string) => {
    const { error } = await supabase
      .from("rp_event_triggers")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete trigger", variant: "destructive" });
      return false;
    }

    toast({ title: "Trigger deleted" });
    await fetchTriggers();
    return true;
  };

  const createEvent = async (
    triggerId: string,
    name: string,
    eventType: EventType,
    payload: Record<string, unknown>
  ) => {
    const { error } = await supabase
      .from("rp_triggered_events")
      .insert({
        campaign_id: campaignId,
        trigger_id: triggerId,
        name,
        event_type: eventType,
        payload: JSON.parse(JSON.stringify(payload)),
      });

    if (error) {
      toast({ title: "Failed to create event", variant: "destructive" });
      return false;
    }

    toast({ title: "Event added!" });
    await fetchTriggers();
    return true;
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from("rp_triggered_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast({ title: "Failed to delete event", variant: "destructive" });
      return false;
    }

    await fetchTriggers();
    return true;
  };

  return {
    triggers,
    loading,
    fetchTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    createEvent,
    deleteEvent,
  };
};
