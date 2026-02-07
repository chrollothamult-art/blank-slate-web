import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface RpAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  ability_type: "passive" | "active" | "stat_boost";
  stat_bonus: Record<string, number> | null;
  unlock_requirements: Record<string, unknown> | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  created_at: string;
}

export interface RpFaction {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  color: string;
  reputation_levels: Record<string, number>;
  created_at: string;
}

export interface RpCharacterAbility {
  id: string;
  character_id: string;
  ability_name: string;
  description: string | null;
  source_session_id: string | null;
  source_node_id: string | null;
  unlocked_at: string;
}

export interface RpCharacterFaction {
  id: string;
  character_id: string;
  faction_id: string;
  reputation: number;
  rank: string;
  joined_at: string | null;
  updated_at: string;
  faction?: RpFaction;
}

export interface RpLevelBenefit {
  id: string;
  level: number;
  xp_required: number;
  stat_points_granted: number;
  ability_slots_granted: number;
  title: string | null;
  description: string | null;
}

const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };

export const useProgression = (characterId?: string) => {
  const { user } = useAuth();
  const [abilities, setAbilities] = useState<RpAbility[]>([]);
  const [factions, setFactions] = useState<RpFaction[]>([]);
  const [levelBenefits, setLevelBenefits] = useState<RpLevelBenefit[]>([]);
  const [characterAbilities, setCharacterAbilities] = useState<RpCharacterAbility[]>([]);
  const [characterFactions, setCharacterFactions] = useState<RpCharacterFaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all abilities
  const fetchAbilities = useCallback(async () => {
    const { data, error } = await supabase
      .from("rp_abilities")
      .select("*")
      .order("rarity", { ascending: true });

    if (error) {
      console.error("Error fetching abilities:", error);
      return;
    }

    const mapped = (data || []).map((a) => ({
      ...a,
      ability_type: a.ability_type as RpAbility["ability_type"],
      stat_bonus: a.stat_bonus as Record<string, number> | null,
      unlock_requirements: a.unlock_requirements as Record<string, unknown> | null,
      rarity: a.rarity as RpAbility["rarity"],
    }));

    mapped.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    setAbilities(mapped);
  }, []);

  // Fetch all factions
  const fetchFactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("rp_factions")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching factions:", error);
      return;
    }

    setFactions(
      (data || []).map((f) => ({
        ...f,
        reputation_levels: f.reputation_levels as Record<string, number>,
      }))
    );
  }, []);

  // Fetch level benefits
  const fetchLevelBenefits = useCallback(async () => {
    const { data, error } = await supabase
      .from("rp_level_benefits")
      .select("*")
      .order("level");

    if (error) {
      console.error("Error fetching level benefits:", error);
      return;
    }

    setLevelBenefits(data || []);
  }, []);

  // Fetch character's unlocked abilities
  const fetchCharacterAbilities = useCallback(async () => {
    if (!characterId) return;

    const { data: charAbilityData, error } = await supabase
      .from("rp_character_abilities")
      .select("*")
      .eq("character_id", characterId)
      .order("unlocked_at", { ascending: false });

    if (error) {
      console.error("Error fetching character abilities:", error);
      return;
    }

    setCharacterAbilities(
      (charAbilityData || []).map((ca) => ({
        id: ca.id,
        character_id: ca.character_id,
        ability_name: ca.ability_name,
        description: ca.description,
        source_session_id: ca.source_session_id || null,
        source_node_id: ca.source_node_id || null,
        unlocked_at: ca.unlocked_at,
      }))
    );
  }, [characterId]);

  // Fetch character's faction standings
  const fetchCharacterFactions = useCallback(async () => {
    if (!characterId) return;

    const { data: charFactionData, error } = await supabase
      .from("rp_character_factions")
      .select("*")
      .eq("character_id", characterId)
      .order("reputation", { ascending: false });

    if (error) {
      console.error("Error fetching character factions:", error);
      return;
    }

    if (charFactionData && charFactionData.length > 0) {
      const factionIds = charFactionData.map((cf) => cf.faction_id);
      
      const { data: factionsData } = await supabase
        .from("rp_factions")
        .select("*")
        .in("id", factionIds);

      const factionsMap = new Map((factionsData || []).map((f) => [f.id, f]));

      setCharacterFactions(
        charFactionData.map((cf) => {
          const rawFaction = factionsMap.get(cf.faction_id);
          return {
            id: cf.id,
            character_id: cf.character_id,
            faction_id: cf.faction_id,
            reputation: cf.reputation,
            rank: cf.rank,
            joined_at: cf.joined_at,
            updated_at: cf.updated_at,
            faction: rawFaction
              ? {
                  id: rawFaction.id,
                  name: rawFaction.name,
                  description: rawFaction.description,
                  image_url: rawFaction.image_url,
                  color: rawFaction.color || "#6366f1",
                  reputation_levels: rawFaction.reputation_levels as Record<string, number>,
                  created_at: rawFaction.created_at,
                }
              : undefined,
          };
        })
      );
    } else {
      setCharacterFactions([]);
    }
  }, [characterId]);

  // Unlock an ability for a character
  const unlockAbility = async (
    abilityName: string,
    description?: string,
    sessionId?: string,
    nodeId?: string
  ): Promise<boolean> => {
    if (!characterId || !user) {
      toast({ title: "Unable to unlock ability", variant: "destructive" });
      return false;
    }

    const existing = characterAbilities.find((ca) => ca.ability_name === abilityName);
    if (existing) {
      toast({ title: "Ability already unlocked" });
      return false;
    }

    const { error } = await supabase.from("rp_character_abilities").insert([{
      character_id: characterId,
      ability_name: abilityName,
      description: description || null,
      source_session_id: sessionId || null,
      source_node_id: nodeId || null,
    }]);

    if (error) {
      toast({
        title: "Failed to unlock ability",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Ability Unlocked!",
      description: `You learned ${abilityName}!`,
    });

    await fetchCharacterAbilities();
    return true;
  };

  // Update faction reputation
  const updateFactionReputation = async (
    factionId: string,
    reputationChange: number
  ): Promise<boolean> => {
    if (!characterId || !user) return false;

    const existing = characterFactions.find((cf) => cf.faction_id === factionId);

    if (existing) {
      const newReputation = existing.reputation + reputationChange;
      const newRank = calculateRank(newReputation, existing.faction?.reputation_levels);

      const { error } = await supabase
        .from("rp_character_factions")
        .update({
          reputation: newReputation,
          rank: newRank,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Error updating faction reputation:", error);
        return false;
      }
    } else {
      const faction = factions.find((f) => f.id === factionId);
      const newRank = calculateRank(reputationChange, faction?.reputation_levels);

      const { error } = await supabase.from("rp_character_factions").insert([{
        character_id: characterId,
        faction_id: factionId,
        reputation: reputationChange,
        rank: newRank,
        joined_at: new Date().toISOString(),
      }]);

      if (error) {
        console.error("Error creating faction reputation:", error);
        return false;
      }
    }

    const faction = factions.find((f) => f.id === factionId);
    if (reputationChange > 0) {
      toast({
        title: `${faction?.name || "Faction"} Reputation +${reputationChange}`,
      });
    } else if (reputationChange < 0) {
      toast({
        title: `${faction?.name || "Faction"} Reputation ${reputationChange}`,
        variant: "destructive",
      });
    }

    await fetchCharacterFactions();
    return true;
  };

  // Calculate rank from reputation
  const calculateRank = (reputation: number, levels?: Record<string, number>): string => {
    const defaultLevels = {
      hostile: -100,
      unfriendly: -50,
      neutral: 0,
      friendly: 50,
      honored: 100,
      exalted: 200,
    };

    const repLevels = levels || defaultLevels;
    const sortedLevels = Object.entries(repLevels).sort((a, b) => b[1] - a[1]);

    for (const [rank, threshold] of sortedLevels) {
      if (reputation >= threshold) return rank;
    }

    return "hostile";
  };

  // Get level info for a given XP amount
  const getLevelInfo = (xp: number) => {
    const currentLevel = levelBenefits.find((lb, i) => {
      const nextLevel = levelBenefits[i + 1];
      return xp >= lb.xp_required && (!nextLevel || xp < nextLevel.xp_required);
    });

    const nextLevel = currentLevel
      ? levelBenefits.find((lb) => lb.level === currentLevel.level + 1)
      : levelBenefits[1];

    return {
      level: currentLevel?.level || 1,
      currentXp: xp,
      xpForCurrentLevel: currentLevel?.xp_required || 0,
      xpForNextLevel: nextLevel?.xp_required || currentLevel?.xp_required || 100,
      title: currentLevel?.title || null,
      nextTitle: nextLevel?.title || null,
    };
  };

  // Get stat bonus from abilities - matches ability names to rp_abilities table
  const getAbilityStatBonus = () => {
    const bonus: Record<string, number> = {};

    for (const ca of characterAbilities) {
      // Find matching ability in the abilities list by name
      const matchedAbility = abilities.find(a => a.name === ca.ability_name);
      if (matchedAbility?.stat_bonus) {
        for (const [stat, value] of Object.entries(matchedAbility.stat_bonus)) {
          bonus[stat] = (bonus[stat] || 0) + value;
        }
      }
    }

    return bonus;
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAbilities(),
        fetchFactions(),
        fetchLevelBenefits(),
        fetchCharacterAbilities(),
        fetchCharacterFactions(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchAbilities, fetchFactions, fetchLevelBenefits, fetchCharacterAbilities, fetchCharacterFactions]);

  return {
    abilities,
    factions,
    levelBenefits,
    characterAbilities,
    characterFactions,
    loading,
    unlockAbility,
    updateFactionReputation,
    getLevelInfo,
    getAbilityStatBonus,
    calculateRank,
    refetchAbilities: fetchCharacterAbilities,
    refetchFactions: fetchCharacterFactions,
  };
};
