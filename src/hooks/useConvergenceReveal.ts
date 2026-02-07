import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConvergencePlayer {
  id: string;
  characterName: string;
  characterPortrait?: string;
  playerName: string;
  faction?: string;
  keyChoices: string[];
  relationship: "ally" | "enemy" | "neutral";
}

interface ConvergenceData {
  nodeId: string;
  title: string;
  description: string;
  currentPlayer: ConvergencePlayer;
  otherPlayers: ConvergencePlayer[];
}

/**
 * Hook to manage convergence reveal logic for multiplayer campaigns.
 * Checks if the current node is a convergence point and calculates
 * relationship status between players based on their prior choices.
 */
export const useConvergenceReveal = () => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [convergenceData, setConvergenceData] = useState<ConvergenceData | null>(null);

  /**
   * Determines the relationship between two players based on factions and key choices.
   */
  const calculateRelationship = (
    player1Faction: string | null,
    player2Faction: string | null,
    player1Flags: Record<string, unknown>,
    player2Flags: Record<string, unknown>,
    factionRelations: Array<{ faction_a_id: string; faction_b_id: string; relation_type: string }>
  ): "ally" | "enemy" | "neutral" => {
    // If both in same faction, they're allies
    if (player1Faction && player2Faction && player1Faction === player2Faction) {
      return "ally";
    }

    // Check faction relations if both have factions
    if (player1Faction && player2Faction) {
      const relation = factionRelations.find(
        (r) =>
          (r.faction_a_id === player1Faction && r.faction_b_id === player2Faction) ||
          (r.faction_a_id === player2Faction && r.faction_b_id === player1Faction)
      );

      if (relation) {
        if (relation.relation_type === "hostile") return "enemy";
        if (relation.relation_type === "allied") return "ally";
      }
    }

    // Check story flags for opposing choices
    const p1Choices = (player1Flags.choices_made || []) as Array<{ choice_text: string }>;
    const p2Choices = (player2Flags.choices_made || []) as Array<{ choice_text: string }>;

    // Look for betrayal flags
    if (player1Flags.betrayed_faction || player2Flags.betrayed_faction) {
      return "enemy";
    }

    // Look for alliance flags
    if (player1Flags.seeks_alliance && player2Flags.seeks_alliance) {
      return "ally";
    }

    return "neutral";
  };

  /**
   * Check if a node is a convergence point and gather player data.
   */
  const checkForConvergence = useCallback(
    async (
      sessionId: string,
      nodeId: string,
      currentCharacterId: string,
      campaignId: string
    ): Promise<boolean> => {
      // Check if node is a convergence node
      const { data: convergenceNode } = await supabase
        .from("rp_convergence_nodes")
        .select("*")
        .eq("node_id", nodeId)
        .single();

      if (!convergenceNode) {
        return false;
      }

      // Fetch all participants in this session
      const { data: participants } = await supabase
        .from("rp_session_participants")
        .select(`
          character_id,
          character:rp_characters(
            id, name, portrait_url, user_id,
            user:profiles(username, avatar_url)
          )
        `)
        .eq("session_id", sessionId);

      if (!participants || participants.length < 2) {
        return false; // Need at least 2 players for convergence
      }

      // Get faction standings and relations
      const { data: factionStandings } = await supabase
        .from("rp_character_faction_standing")
        .select("character_id, campaign_faction_id, reputation_score")
        .eq("session_id", sessionId);

      const { data: factionRelations } = await supabase
        .from("rp_faction_relations")
        .select("faction_a_id, faction_b_id, relation_type")
        .eq("campaign_id", campaignId);

      // Get progress data for all participants
      const { data: progressData } = await supabase
        .from("rp_character_progress")
        .select("character_id, story_flags")
        .eq("session_id", sessionId);

      const progressMap = new Map(
        progressData?.map((p) => [p.character_id, p.story_flags || {}]) || []
      );

      const standingMap = new Map<string, string>();
      factionStandings?.forEach((s) => {
        if (s.reputation_score > 30) {
          standingMap.set(s.character_id, s.campaign_faction_id);
        }
      });

      // Build player data
      const players: ConvergencePlayer[] = [];
      let currentPlayerData: ConvergencePlayer | null = null;

      for (const p of participants) {
        const char = p.character as unknown as {
          id: string;
          name: string;
          portrait_url?: string;
          user_id: string;
          user?: { username: string; avatar_url?: string };
        };

        if (!char) continue;

        const flags = (progressMap.get(char.id) || {}) as Record<string, unknown>;
        const choices = ((flags.choices_made || []) as Array<{ choice_text: string }>)
          .slice(-3)
          .map((c) => c.choice_text);

        const playerData: ConvergencePlayer = {
          id: char.id,
          characterName: char.name,
          characterPortrait: char.portrait_url,
          playerName: char.user?.username || "Unknown",
          faction: standingMap.get(char.id),
          keyChoices: choices,
          relationship: "neutral", // Will be calculated relative to current player
        };

        if (char.id === currentCharacterId) {
          currentPlayerData = playerData;
        } else {
          players.push(playerData);
        }
      }

      if (!currentPlayerData || players.length === 0) {
        return false;
      }

      // Calculate relationships relative to current player
      const currentFlags = (progressMap.get(currentCharacterId) || {}) as Record<string, unknown>;
      const currentFaction = standingMap.get(currentCharacterId) || null;

      const otherPlayersWithRelations = players.map((player) => {
        const otherFlags = (progressMap.get(player.id) || {}) as Record<string, unknown>;
        const otherFaction = standingMap.get(player.id) || null;

        return {
          ...player,
          relationship: calculateRelationship(
            currentFaction,
            otherFaction,
            currentFlags,
            otherFlags,
            factionRelations || []
          ),
        };
      });

      setConvergenceData({
        nodeId,
        title: "Paths Converge",
        description:
          "Your journey has led you to this moment. The choices you've made will determine how you meet these fellow travelers.",
        currentPlayer: currentPlayerData,
        otherPlayers: otherPlayersWithRelations,
      });

      setIsRevealing(true);
      return true;
    },
    []
  );

  const closeReveal = useCallback(() => {
    setIsRevealing(false);
  }, []);

  const continueAfterReveal = useCallback(() => {
    setIsRevealing(false);
    // The caller should handle navigation to the next node
  }, []);

  return {
    isRevealing,
    convergenceData,
    checkForConvergence,
    closeReveal,
    continueAfterReveal,
  };
};
