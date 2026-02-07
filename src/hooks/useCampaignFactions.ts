import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type FactionRelationType = "allied" | "neutral" | "hostile";

export interface CampaignFaction {
  id: string;
  campaign_id: string;
  faction_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  color: string;
  values: Record<string, string>;
  perks: Array<{ level: string; perk: string }>;
  is_joinable: boolean;
  created_at: string;
  updated_at: string;
}

export interface FactionRelation {
  id: string;
  campaign_id: string;
  faction_a_id: string;
  faction_b_id: string;
  relation_type: FactionRelationType;
  description: string | null;
  created_at: string;
}

export interface CharacterFactionStanding {
  id: string;
  session_id: string;
  character_id: string;
  campaign_faction_id: string;
  reputation_score: number;
  rank: string;
  is_member: boolean;
  joined_at: string | null;
  betrayed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const RELATION_TYPE_LABELS: Record<FactionRelationType, { label: string; color: string; icon: string }> = {
  allied: { label: "Allied", color: "text-green-500", icon: "🤝" },
  neutral: { label: "Neutral", color: "text-muted-foreground", icon: "➖" },
  hostile: { label: "Hostile", color: "text-red-500", icon: "⚔️" },
};

const REPUTATION_RANKS = [
  { min: -100, max: -50, rank: "hated" },
  { min: -49, max: -20, rank: "hostile" },
  { min: -19, max: -1, rank: "unfriendly" },
  { min: 0, max: 19, rank: "neutral" },
  { min: 20, max: 49, rank: "friendly" },
  { min: 50, max: 79, rank: "honored" },
  { min: 80, max: 100, rank: "exalted" },
];

export const useCampaignFactions = (campaignId: string) => {
  const [factions, setFactions] = useState<CampaignFaction[]>([]);
  const [relations, setRelations] = useState<FactionRelation[]>([]);
  const [standings, setStandings] = useState<CharacterFactionStanding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFactions = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_campaign_factions")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at");

    if (error) {
      console.error("Error fetching campaign factions:", error);
      setLoading(false);
      return;
    }

    const mapped: CampaignFaction[] = (data || []).map((f) => ({
      ...f,
      values: (f.values as Record<string, string>) || {},
      perks: (f.perks as Array<{ level: string; perk: string }>) || [],
    }));

    setFactions(mapped);
    setLoading(false);
  }, [campaignId]);

  const fetchRelations = useCallback(async () => {
    if (!campaignId) return;

    const { data, error } = await supabase
      .from("rp_faction_relations")
      .select("*")
      .eq("campaign_id", campaignId);

    if (error) {
      console.error("Error fetching faction relations:", error);
      return;
    }

    setRelations(
      (data || []).map((r) => ({
        ...r,
        relation_type: r.relation_type as FactionRelationType,
      }))
    );
  }, [campaignId]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchFactions(), fetchRelations()]);
  }, [fetchFactions, fetchRelations]);

  // Faction CRUD
  const createFaction = async (
    name: string,
    options?: {
      faction_id?: string;
      description?: string;
      image_url?: string;
      color?: string;
      values?: Record<string, string>;
      perks?: Array<{ level: string; perk: string }>;
      is_joinable?: boolean;
    }
  ) => {
    const { data, error } = await supabase
      .from("rp_campaign_factions")
      .insert({
        campaign_id: campaignId,
        name,
        faction_id: options?.faction_id || null,
        description: options?.description || null,
        image_url: options?.image_url || null,
        color: options?.color || "#6366f1",
        values: JSON.parse(JSON.stringify(options?.values || {})),
        perks: JSON.parse(JSON.stringify(options?.perks || [])),
        is_joinable: options?.is_joinable ?? true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create faction", variant: "destructive" });
      return null;
    }

    toast({ title: "Faction created!" });
    await fetchFactions();
    return data;
  };

  const updateFaction = async (id: string, updates: Partial<CampaignFaction>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.is_joinable !== undefined) updateData.is_joinable = updates.is_joinable;
    if (updates.values !== undefined) updateData.values = JSON.parse(JSON.stringify(updates.values));
    if (updates.perks !== undefined) updateData.perks = JSON.parse(JSON.stringify(updates.perks));

    const { error } = await supabase
      .from("rp_campaign_factions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update faction", variant: "destructive" });
      return false;
    }

    await fetchFactions();
    return true;
  };

  const deleteFaction = async (id: string) => {
    const { error } = await supabase
      .from("rp_campaign_factions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete faction", variant: "destructive" });
      return false;
    }

    toast({ title: "Faction deleted" });
    await fetchFactions();
    return true;
  };

  // Relation CRUD
  const setRelation = async (
    factionAId: string,
    factionBId: string,
    relationType: FactionRelationType,
    description?: string
  ) => {
    // Check if relation already exists
    const existing = relations.find(
      (r) =>
        (r.faction_a_id === factionAId && r.faction_b_id === factionBId) ||
        (r.faction_a_id === factionBId && r.faction_b_id === factionAId)
    );

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("rp_faction_relations")
        .update({ relation_type: relationType, description: description || null })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Failed to update relation", variant: "destructive" });
        return false;
      }
    } else {
      // Create new
      const { error } = await supabase.from("rp_faction_relations").insert({
        campaign_id: campaignId,
        faction_a_id: factionAId,
        faction_b_id: factionBId,
        relation_type: relationType,
        description: description || null,
      });

      if (error) {
        toast({ title: "Failed to set relation", variant: "destructive" });
        return false;
      }
    }

    await fetchRelations();
    return true;
  };

  const deleteRelation = async (relationId: string) => {
    const { error } = await supabase
      .from("rp_faction_relations")
      .delete()
      .eq("id", relationId);

    if (error) {
      toast({ title: "Failed to delete relation", variant: "destructive" });
      return false;
    }

    await fetchRelations();
    return true;
  };

  // Character Standing
  const loadCharacterStandings = useCallback(
    async (sessionId: string, characterId: string) => {
      const { data, error } = await supabase
        .from("rp_character_faction_standing")
        .select("*")
        .eq("session_id", sessionId)
        .eq("character_id", characterId);

      if (error) {
        console.error("Error fetching standings:", error);
        return;
      }

      setStandings(data || []);
    },
    []
  );

  const updateReputation = async (
    sessionId: string,
    characterId: string,
    factionId: string,
    change: number
  ) => {
    const existing = standings.find(
      (s) =>
        s.session_id === sessionId &&
        s.character_id === characterId &&
        s.campaign_faction_id === factionId
    );

    const newScore = Math.max(-100, Math.min(100, (existing?.reputation_score ?? 0) + change));
    const newRank =
      REPUTATION_RANKS.find((r) => newScore >= r.min && newScore <= r.max)?.rank || "neutral";

    if (existing) {
      const { error } = await supabase
        .from("rp_character_faction_standing")
        .update({ reputation_score: newScore, rank: newRank })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Failed to update reputation", variant: "destructive" });
        return false;
      }
    } else {
      const { error } = await supabase.from("rp_character_faction_standing").insert({
        session_id: sessionId,
        character_id: characterId,
        campaign_faction_id: factionId,
        reputation_score: newScore,
        rank: newRank,
      });

      if (error) {
        toast({ title: "Failed to set reputation", variant: "destructive" });
        return false;
      }
    }

    await loadCharacterStandings(sessionId, characterId);
    return true;
  };

  const joinFaction = async (sessionId: string, characterId: string, factionId: string) => {
    const existing = standings.find(
      (s) =>
        s.session_id === sessionId &&
        s.character_id === characterId &&
        s.campaign_faction_id === factionId
    );

    if (existing) {
      const { error } = await supabase
        .from("rp_character_faction_standing")
        .update({ is_member: true, joined_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Failed to join faction", variant: "destructive" });
        return false;
      }
    } else {
      const { error } = await supabase.from("rp_character_faction_standing").insert({
        session_id: sessionId,
        character_id: characterId,
        campaign_faction_id: factionId,
        is_member: true,
        joined_at: new Date().toISOString(),
      });

      if (error) {
        toast({ title: "Failed to join faction", variant: "destructive" });
        return false;
      }
    }

    toast({ title: "Joined faction!" });
    await loadCharacterStandings(sessionId, characterId);
    return true;
  };

  const betrayFaction = async (sessionId: string, characterId: string, factionId: string) => {
    const existing = standings.find(
      (s) =>
        s.session_id === sessionId &&
        s.character_id === characterId &&
        s.campaign_faction_id === factionId
    );

    if (!existing) {
      toast({ title: "Not a member of this faction", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from("rp_character_faction_standing")
      .update({
        is_member: false,
        betrayed_at: new Date().toISOString(),
        reputation_score: -100,
        rank: "hated",
      })
      .eq("id", existing.id);

    if (error) {
      toast({ title: "Failed to betray faction", variant: "destructive" });
      return false;
    }

    toast({ title: "Faction betrayed! You are now hated." });
    await loadCharacterStandings(sessionId, characterId);
    return true;
  };

  /**
   * Get the relation between two factions
   */
  const getRelation = (factionAId: string, factionBId: string): FactionRelationType => {
    const relation = relations.find(
      (r) =>
        (r.faction_a_id === factionAId && r.faction_b_id === factionBId) ||
        (r.faction_a_id === factionBId && r.faction_b_id === factionAId)
    );
    return relation?.relation_type || "neutral";
  };

  /**
   * Get available perks for a character based on their standing
   */
  const getAvailablePerks = (factionId: string): string[] => {
    const faction = factions.find((f) => f.id === factionId);
    const standing = standings.find((s) => s.campaign_faction_id === factionId);

    if (!faction || !standing) return [];

    const currentRank = standing.rank;
    const rankOrder = ["hated", "hostile", "unfriendly", "neutral", "friendly", "honored", "exalted"];
    const currentRankIndex = rankOrder.indexOf(currentRank);

    return faction.perks
      .filter((p) => {
        const perkRankIndex = rankOrder.indexOf(p.level);
        return perkRankIndex <= currentRankIndex;
      })
      .map((p) => p.perk);
  };

  return {
    factions,
    relations,
    standings,
    loading,
    fetchAll,
    fetchFactions,
    fetchRelations,
    createFaction,
    updateFaction,
    deleteFaction,
    setRelation,
    deleteRelation,
    loadCharacterStandings,
    updateReputation,
    joinFaction,
    betrayFaction,
    getRelation,
    getAvailablePerks,
  };
};
