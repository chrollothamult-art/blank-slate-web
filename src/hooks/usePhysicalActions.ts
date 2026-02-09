import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { ProximityZone, ActionDefinition, PlayerPosition, PvPSettings } from "@/hooks/usePlayerPositions";

// ─── Types ────────────────────────────────────────────────────────

export type ActionCategory = "melee" | "stealth" | "social" | "ranged" | "movement";
export type AwarenessLevel = "oblivious" | "alert" | "vigilant" | "hawkeye";

export interface PhysicalAction {
  id: string;
  name: string;
  category: ActionCategory;
  description: string;
  requiredRange: ProximityZone | "any";
  requiredItem: string | null;
  requiredStat: string | null;
  requiredStatValue: number;
  isDetectable: boolean;
  detectionDifficulty: number;
  successEffect: Record<string, unknown>;
  failureEffect: Record<string, unknown>;
  cooldownTurns: number;
}

export interface ActionAvailability {
  available: boolean;
  reason?: string;
  statMet: boolean;
  rangeMet: boolean;
  itemMet: boolean;
}

export interface StatCheckResult {
  success: boolean;
  attackerRoll: number;
  defenderRoll: number;
  attackerTotal: number;
  defenderTotal: number;
  surpriseBonus: number;
  margin: number;
}

export interface PerceptionResult {
  awarenessLevel: AwarenessLevel;
  detected: boolean;
  message: string;
  perceptionScore: number;
  detectionThreshold: number;
}

export interface PerceptionEvent {
  id: string;
  session_id: string;
  observer_id: string;
  target_id: string;
  perception_roll: number;
  detection_level: AwarenessLevel;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CharacterInventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  item?: {
    id: string;
    name: string;
    item_type: string;
    rarity: string;
    effect: Record<string, unknown>;
  };
}

// ─── Built-in Actions ─────────────────────────────────────────────

export const BUILTIN_ACTIONS: PhysicalAction[] = [
  // Melee
  { id: "stab", name: "Stab", category: "melee", description: "A quick blade strike", requiredRange: "adjacent", requiredItem: "bladed_weapon", requiredStat: "strength", requiredStatValue: 3, isDetectable: true, detectionDifficulty: 5, successEffect: { damage: "high", type: "wound" }, failureEffect: { reveal: true }, cooldownTurns: 1 },
  { id: "slash", name: "Slash", category: "melee", description: "A sweeping blade attack", requiredRange: "adjacent", requiredItem: "bladed_weapon", requiredStat: "strength", requiredStatValue: 4, isDetectable: true, detectionDifficulty: 3, successEffect: { damage: "medium", type: "wound" }, failureEffect: { reveal: true }, cooldownTurns: 1 },
  { id: "punch", name: "Punch", category: "melee", description: "An unarmed strike", requiredRange: "adjacent", requiredItem: null, requiredStat: "strength", requiredStatValue: 2, isDetectable: true, detectionDifficulty: 2, successEffect: { damage: "low", type: "stun" }, failureEffect: { reveal: true }, cooldownTurns: 0 },
  { id: "shove", name: "Shove", category: "melee", description: "Push target back one zone", requiredRange: "adjacent", requiredItem: null, requiredStat: "strength", requiredStatValue: 4, isDetectable: true, detectionDifficulty: 1, successEffect: { push_zone: 1 }, failureEffect: { reveal: true }, cooldownTurns: 1 },

  // Stealth
  { id: "stab_behind", name: "Stab from Behind", category: "stealth", description: "A concealed backstab", requiredRange: "adjacent", requiredItem: "bladed_weapon", requiredStat: "agility", requiredStatValue: 5, isDetectable: true, detectionDifficulty: 8, successEffect: { damage: "critical", type: "wound", surprise: true }, failureEffect: { reveal: true, alert_target: true }, cooldownTurns: 3 },
  { id: "pickpocket", name: "Pickpocket", category: "stealth", description: "Steal an item from target", requiredRange: "adjacent", requiredItem: null, requiredStat: "agility", requiredStatValue: 6, isDetectable: true, detectionDifficulty: 7, successEffect: { steal_item: true }, failureEffect: { reveal: true, reputation: -5 }, cooldownTurns: 2 },
  { id: "plant_item", name: "Plant Item", category: "stealth", description: "Secretly place an item on target", requiredRange: "adjacent", requiredItem: "any", requiredStat: "agility", requiredStatValue: 4, isDetectable: true, detectionDifficulty: 6, successEffect: { plant: true }, failureEffect: { reveal: true }, cooldownTurns: 2 },

  // Social
  { id: "whisper", name: "Whisper", category: "social", description: "Speak privately to target", requiredRange: "close", requiredItem: null, requiredStat: null, requiredStatValue: 0, isDetectable: true, detectionDifficulty: 7, successEffect: { private_message: true }, failureEffect: {}, cooldownTurns: 0 },
  { id: "lie", name: "Lie", category: "social", description: "Deceive the target", requiredRange: "close", requiredItem: null, requiredStat: "charisma", requiredStatValue: 4, isDetectable: true, detectionDifficulty: 5, successEffect: { deception: true, flag_set: true }, failureEffect: { reputation: -3, trust_loss: true }, cooldownTurns: 1 },
  { id: "persuade", name: "Persuade", category: "social", description: "Convince target to act", requiredRange: "close", requiredItem: null, requiredStat: "charisma", requiredStatValue: 5, isDetectable: false, detectionDifficulty: 0, successEffect: { persuasion: true }, failureEffect: { reputation: -1 }, cooldownTurns: 2 },
  { id: "intimidate", name: "Intimidate", category: "social", description: "Frighten the target", requiredRange: "close", requiredItem: null, requiredStat: "strength", requiredStatValue: 5, isDetectable: true, detectionDifficulty: 1, successEffect: { fear: true, push_zone: 1 }, failureEffect: { reputation: -2 }, cooldownTurns: 2 },
  { id: "bargain", name: "Bargain", category: "social", description: "Negotiate a trade", requiredRange: "close", requiredItem: null, requiredStat: "wisdom", requiredStatValue: 3, isDetectable: false, detectionDifficulty: 0, successEffect: { trade: true }, failureEffect: {}, cooldownTurns: 0 },

  // Ranged
  { id: "throw_item", name: "Throw Item", category: "ranged", description: "Hurl an item at target", requiredRange: "mid", requiredItem: "throwable", requiredStat: "agility", requiredStatValue: 3, isDetectable: true, detectionDifficulty: 1, successEffect: { damage: "low", lose_item: true }, failureEffect: { lose_item: true }, cooldownTurns: 0 },
  { id: "shoot_bow", name: "Shoot Bow", category: "ranged", description: "Fire an arrow at target", requiredRange: "mid", requiredItem: "bow", requiredStat: "agility", requiredStatValue: 4, isDetectable: true, detectionDifficulty: 1, successEffect: { damage: "medium", type: "wound" }, failureEffect: { reveal: true }, cooldownTurns: 1 },
  { id: "cast_spell", name: "Cast Spell", category: "ranged", description: "Channel magical energy", requiredRange: "mid", requiredItem: null, requiredStat: "magic", requiredStatValue: 5, isDetectable: true, detectionDifficulty: 2, successEffect: { magic_effect: true }, failureEffect: { backfire: true }, cooldownTurns: 2 },

  // Movement
  { id: "block_path", name: "Block Path", category: "movement", description: "Physically bar movement", requiredRange: "close", requiredItem: null, requiredStat: "strength", requiredStatValue: 4, isDetectable: true, detectionDifficulty: 1, successEffect: { block: true }, failureEffect: {}, cooldownTurns: 1 },
  { id: "follow_silently", name: "Follow Silently", category: "movement", description: "Shadow the target", requiredRange: "mid", requiredItem: null, requiredStat: "agility", requiredStatValue: 5, isDetectable: true, detectionDifficulty: 7, successEffect: { follow: true }, failureEffect: { reveal: true }, cooldownTurns: 1 },
];

// ─── Constants ────────────────────────────────────────────────────

const SURPRISE_BONUS = 3;

const AWARENESS_THRESHOLDS: Record<AwarenessLevel, number> = {
  oblivious: 0,
  alert: 4,
  vigilant: 7,
  hawkeye: 10,
};

const AWARENESS_MESSAGES: Record<AwarenessLevel, (targetName: string) => string> = {
  oblivious: () => "",
  alert: () => "You sense something is off…",
  vigilant: (name) => `${name} is doing something suspicious…`,
  hawkeye: (name) => `You clearly see ${name}'s intentions!`,
};

// ─── Dice Utilities ───────────────────────────────────────────────

const rollD10 = () => Math.floor(Math.random() * 10) + 1;

// ─── Hook ─────────────────────────────────────────────────────────

export const usePhysicalActions = (
  sessionId: string,
  campaignId: string,
  myCharacterId: string | null,
  positions: PlayerPosition[],
  pvpSettings: PvPSettings | null,
) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<CharacterInventoryItem[]>([]);
  const [characterStats, setCharacterStats] = useState<Record<string, number>>({});
  const [characterLevel, setCharacterLevel] = useState(1);
  const [perceptionEvents, setPerceptionEvents] = useState<PerceptionEvent[]>([]);
  const [unreadPerceptionCount, setUnreadPerceptionCount] = useState(0);
  const [customActions, setCustomActions] = useState<PhysicalAction[]>([]);
  const [preparationSlots, setPreparationSlots] = useState(2);

  // ── Load character data ──────────────────────────────────────

  const loadCharacterData = useCallback(async () => {
    if (!myCharacterId) return;

    // Load character stats and level
    const { data: character } = await supabase
      .from("rp_characters")
      .select("stats, level, ability_slots")
      .eq("id", myCharacterId)
      .single();

    if (character) {
      const rawStats = character.stats as unknown;
      const stats = rawStats && typeof rawStats === "object" && !Array.isArray(rawStats)
        ? (rawStats as Record<string, number>)
        : {};
      setCharacterStats(stats);
      setCharacterLevel(character.level || 1);
      // Preparation slots: base 2 + 1 per 3 levels + wisdom bonus
      const wisdomBonus = Math.floor((stats.wisdom || 3) / 3);
      setPreparationSlots(2 + Math.floor((character.level || 1) / 3) + wisdomBonus);
    }

    // Load inventory
    const { data: inv } = await supabase
      .from("rp_character_inventory")
      .select(`
        id, item_id, quantity,
        item:rp_items(id, name, item_type, rarity, effect)
      `)
      .eq("character_id", myCharacterId);

    if (inv) {
      setInventory(
        inv.map((i) => ({
          id: i.id,
          item_id: i.item_id,
          quantity: i.quantity,
          item: i.item as unknown as CharacterInventoryItem["item"],
        }))
      );
    }
  }, [myCharacterId]);

  // ── Load custom campaign actions ─────────────────────────────

  const loadCustomActions = useCallback(async () => {
    if (!campaignId) return;

    const { data } = await supabase
      .from("rp_action_definitions")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_enabled", true);

    if (data) {
      setCustomActions(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          category: (d.category || "melee") as ActionCategory,
          description: d.description || "",
          requiredRange: d.required_range as ProximityZone | "any",
          requiredItem: d.required_item,
          requiredStat: d.required_stat,
          requiredStatValue: d.required_stat_value || 0,
          isDetectable: d.is_detectable ?? true,
          detectionDifficulty: d.detection_difficulty || 5,
          successEffect: (d.success_effect || {}) as Record<string, unknown>,
          failureEffect: (d.failure_effect || {}) as Record<string, unknown>,
          cooldownTurns: d.cooldown_turns || 0,
        }))
      );
    }
  }, [campaignId]);

  // ── Load perception events ───────────────────────────────────

  const loadPerceptionEvents = useCallback(async () => {
    if (!sessionId || !myCharacterId) return;

    const { data } = await supabase
      .from("rp_perception_events")
      .select("*")
      .eq("session_id", sessionId)
      .eq("observer_id", myCharacterId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const events = data.map((e) => ({
        ...e,
        detection_level: e.detection_level as AwarenessLevel,
      }));
      setPerceptionEvents(events);
      setUnreadPerceptionCount(events.filter((e) => !e.is_read).length);
    }
  }, [sessionId, myCharacterId]);

  // ── All available actions (built-in + custom) ────────────────

  const allActions = useMemo(
    () => [...BUILTIN_ACTIONS, ...customActions],
    [customActions]
  );

  // ── Check action availability ────────────────────────────────

  const checkActionAvailability = useCallback(
    (action: PhysicalAction, targetCharacterId: string): ActionAvailability => {
      // Range check
      const ZONE_ORDER: ProximityZone[] = ["adjacent", "close", "mid", "far"];
      let rangeMet = true;
      if (action.requiredRange !== "any") {
        const pos = positions.find(
          (p) => p.character_id === myCharacterId && p.relative_to_character_id === targetCharacterId
        );
        const currentZone = pos?.zone || "far";
        const requiredIdx = ZONE_ORDER.indexOf(action.requiredRange);
        const currentIdx = ZONE_ORDER.indexOf(currentZone);
        rangeMet = currentIdx <= requiredIdx;
      }

      // Item check
      let itemMet = true;
      if (action.requiredItem) {
        if (action.requiredItem === "any") {
          itemMet = inventory.length > 0;
        } else {
          itemMet = inventory.some(
            (i) => i.item?.item_type === action.requiredItem || i.item?.name?.toLowerCase().includes(action.requiredItem!.replace("_", " "))
          );
        }
      }

      // Stat check
      let statMet = true;
      if (action.requiredStat) {
        const value = characterStats[action.requiredStat] || 0;
        statMet = value >= action.requiredStatValue;
      }

      const available = rangeMet && itemMet && statMet;
      let reason: string | undefined;
      if (!rangeMet) reason = `Requires ${action.requiredRange} range`;
      else if (!itemMet) reason = `Requires ${action.requiredItem?.replace("_", " ")}`;
      else if (!statMet) reason = `Requires ${action.requiredStat} ≥ ${action.requiredStatValue}`;

      return { available, reason, statMet, rangeMet, itemMet };
    },
    [positions, myCharacterId, inventory, characterStats]
  );

  // ── Get available actions for a target ───────────────────────

  const getAvailableActions = useCallback(
    (targetCharacterId: string) => {
      return allActions.map((action) => ({
        action,
        availability: checkActionAvailability(action, targetCharacterId),
      }));
    },
    [allActions, checkActionAvailability]
  );

  // ── Passive Perception ───────────────────────────────────────

  const calculatePassivePerception = useCallback(
    (stats?: Record<string, number>, level?: number) => {
      const s = stats || characterStats;
      const l = level || characterLevel;
      return (s.wisdom || 3) + Math.floor((s.agility || 3) / 2) + Math.floor(l / 2);
    },
    [characterStats, characterLevel]
  );

  // ── Stat Check Roll ──────────────────────────────────────────

  const performStatCheck = useCallback(
    (
      attackerStat: number,
      defenderStat: number,
      isHidden: boolean
    ): StatCheckResult => {
      const attackerRoll = rollD10();
      const defenderRoll = rollD10();
      const surpriseBonus = isHidden ? SURPRISE_BONUS : 0;
      const attackerTotal = attackerRoll + attackerStat + surpriseBonus;
      const defenderTotal = defenderRoll + defenderStat;

      return {
        success: attackerTotal >= defenderTotal,
        attackerRoll,
        defenderRoll,
        attackerTotal,
        defenderTotal,
        surpriseBonus,
        margin: attackerTotal - defenderTotal,
      };
    },
    []
  );

  // ── Perception Check ─────────────────────────────────────────

  const performPerceptionCheck = useCallback(
    (
      observerStats: Record<string, number>,
      observerLevel: number,
      detectionDifficulty: number,
      environmentModifier = 0
    ): PerceptionResult => {
      const passivePerception = calculatePassivePerception(observerStats, observerLevel);
      const roll = rollD10();
      const perceptionScore = roll + passivePerception + environmentModifier;
      const detectionThreshold = detectionDifficulty + rollD10();

      let awarenessLevel: AwarenessLevel = "oblivious";
      if (perceptionScore >= AWARENESS_THRESHOLDS.hawkeye + detectionDifficulty) {
        awarenessLevel = "hawkeye";
      } else if (perceptionScore >= AWARENESS_THRESHOLDS.vigilant + detectionDifficulty / 2) {
        awarenessLevel = "vigilant";
      } else if (perceptionScore >= AWARENESS_THRESHOLDS.alert) {
        awarenessLevel = "alert";
      }

      return {
        awarenessLevel,
        detected: awarenessLevel !== "oblivious",
        message: AWARENESS_MESSAGES[awarenessLevel]("Someone"),
        perceptionScore,
        detectionThreshold,
      };
    },
    [calculatePassivePerception]
  );

  // ── Execute Physical Action ──────────────────────────────────

  const executePhysicalAction = useCallback(
    async (
      action: PhysicalAction,
      targetCharacterId: string,
      isPrepared: boolean,
      preparedActionId?: string
    ) => {
      if (!sessionId || !myCharacterId || !user) return null;

      // 1. Check availability
      const availability = checkActionAvailability(action, targetCharacterId);
      if (!availability.available) {
        toast({ title: "Action unavailable", description: availability.reason, variant: "destructive" });
        return null;
      }

      // 2. Resolve stat check
      const attackerStatValue = action.requiredStat ? (characterStats[action.requiredStat] || 3) : 5;

      // Get defender stats
      const { data: defenderChar } = await supabase
        .from("rp_characters")
        .select("stats, level")
        .eq("id", targetCharacterId)
        .single();

      const defenderStats = (defenderChar?.stats as unknown as Record<string, number>) || {};
      const defenderStatValue = action.requiredStat
        ? (defenderStats[action.requiredStat] || 3)
        : 5;

      const statCheck = performStatCheck(attackerStatValue, defenderStatValue, isPrepared);

      // 3. Determine witnesses
      const nearbyPositions = positions.filter(
        (p) =>
          p.character_id !== myCharacterId &&
          p.character_id !== targetCharacterId &&
          (p.zone === "adjacent" || p.zone === "close" || p.zone === "mid")
      );
      const witnessIds = [...new Set(nearbyPositions.map((p) => p.character_id))];

      // 4. Detection check — check if action was detected by target or witnesses
      let wasDetected = !action.isDetectable ? false : false;
      const detectionEvents: Array<{ observerId: string; level: AwarenessLevel; message: string }> = [];

      if (action.isDetectable) {
        // Target perception check
        const targetPerception = performPerceptionCheck(
          defenderStats,
          defenderChar?.level || 1,
          action.detectionDifficulty
        );
        if (targetPerception.detected) {
          wasDetected = true;
          detectionEvents.push({
            observerId: targetCharacterId,
            level: targetPerception.awarenessLevel,
            message: targetPerception.message,
          });
        }

        // Witness perception checks
        for (const witnessId of witnessIds) {
          const { data: witnessChar } = await supabase
            .from("rp_characters")
            .select("stats, level")
            .eq("id", witnessId)
            .single();

          if (witnessChar) {
            const witnessStats = (witnessChar.stats as unknown as Record<string, number>) || {};
            const witnessPerception = performPerceptionCheck(
              witnessStats,
              witnessChar.level || 1,
              action.detectionDifficulty + 2 // Harder for bystanders
            );
            if (witnessPerception.detected) {
              detectionEvents.push({
                observerId: witnessId,
                level: witnessPerception.awarenessLevel,
                message: witnessPerception.message,
              });
            }
          }
        }
      }

      // 5. Build outcome
      const outcome = statCheck.success ? action.successEffect : action.failureEffect;

      // 6. Log the action
      const { error: logError } = await supabase.from("rp_action_log").insert({
        session_id: sessionId,
        actor_id: myCharacterId,
        target_id: targetCharacterId,
        action_type: action.id,
        action_category: action.category,
        stat_check_result: statCheck as unknown as Record<string, never>,
        was_detected: wasDetected,
        outcome: outcome as unknown as Record<string, never>,
        witnesses: witnessIds as unknown as never[],
      });

      if (logError) {
        console.error("Error logging action:", logError);
      }

      // 7. Create perception events for observers
      for (const event of detectionEvents) {
        await supabase.from("rp_perception_events").insert({
          session_id: sessionId,
          observer_id: event.observerId,
          target_id: myCharacterId,
          perception_roll: 0,
          detection_level: event.level,
          message: event.message,
        });
      }

      // 8. Mark prepared action as used
      if (preparedActionId) {
        await supabase
          .from("rp_prepared_actions")
          .update({ is_used: true, is_revealed: true })
          .eq("id", preparedActionId);
      }

      // 9. Show result to player
      if (statCheck.success) {
        toast({
          title: `${action.name} — Success!`,
          description: `Roll: ${statCheck.attackerTotal} vs ${statCheck.defenderTotal} (margin: +${statCheck.margin})${isPrepared ? " (surprise bonus!)" : ""}`,
        });
      } else {
        toast({
          title: `${action.name} — Failed`,
          description: `Roll: ${statCheck.attackerTotal} vs ${statCheck.defenderTotal} (margin: ${statCheck.margin})`,
          variant: "destructive",
        });
      }

      // 10. Reload perception events
      await loadPerceptionEvents();

      return { statCheck, wasDetected, outcome, witnesses: witnessIds, detectionEvents };
    },
    [
      sessionId, myCharacterId, user, characterStats, positions,
      checkActionAvailability, performStatCheck, performPerceptionCheck,
      loadPerceptionEvents,
    ]
  );

  // ── Mark perception events as read ───────────────────────────

  const markPerceptionRead = useCallback(async () => {
    if (!sessionId || !myCharacterId) return;

    await supabase
      .from("rp_perception_events")
      .update({ is_read: true })
      .eq("session_id", sessionId)
      .eq("observer_id", myCharacterId)
      .eq("is_read", false);

    setUnreadPerceptionCount(0);
    setPerceptionEvents((prev) => prev.map((e) => ({ ...e, is_read: true })));
  }, [sessionId, myCharacterId]);

  // ── Initialize ───────────────────────────────────────────────

  useEffect(() => {
    if (myCharacterId && campaignId) {
      loadCharacterData();
      loadCustomActions();
      loadPerceptionEvents();
    }
  }, [myCharacterId, campaignId, loadCharacterData, loadCustomActions, loadPerceptionEvents]);

  // ── Realtime perception subscriptions ────────────────────────

  useEffect(() => {
    if (!sessionId || !myCharacterId) return;

    const channel = supabase
      .channel(`perception-${sessionId}-${myCharacterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rp_perception_events",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newEvent = payload.new as PerceptionEvent;
          if (newEvent.observer_id === myCharacterId) {
            setPerceptionEvents((prev) => [newEvent, ...prev]);
            setUnreadPerceptionCount((c) => c + 1);
            if (newEvent.detection_level !== "oblivious" && newEvent.message) {
              toast({ title: "⚠️ Perception Alert", description: newEvent.message });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, myCharacterId]);

  return {
    allActions,
    inventory,
    characterStats,
    characterLevel,
    preparationSlots,
    perceptionEvents,
    unreadPerceptionCount,
    checkActionAvailability,
    getAvailableActions,
    calculatePassivePerception,
    performStatCheck,
    performPerceptionCheck,
    executePhysicalAction,
    markPerceptionRead,
    loadCharacterData,
  };
};
