import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";

/**
 * Hook that checks and awards RP-specific achievements/badges.
 * Call checkAchievements() after significant game events.
 */
export const useRpAchievements = () => {
  const { user } = useAuth();
  const { awardBadgeByName, hasBadgeByName } = useBadges();

  const checkAchievements = useCallback(async () => {
    if (!user) return;

    // Fetch character and session data for checks
    const characterIds = (
      await supabase
        .from("rp_characters")
        .select("id")
        .eq("user_id", user.id)
    ).data?.map((c) => c.id) || [];

    const [
      { data: characters },
      { data: sessions },
      { data: proposals },
      { data: progress },
      { data: endingsSeen },
    ] = await Promise.all([
      supabase
        .from("rp_characters")
        .select("id, level, xp")
        .eq("user_id", user.id),
      supabase
        .from("rp_sessions")
        .select("id, status, campaign_id")
        .eq("created_by", user.id),
      supabase
        .from("rp_lore_proposals")
        .select("id, status")
        .eq("user_id", user.id),
      supabase
        .from("rp_character_progress")
        .select("nodes_visited, stat_checks_by_type")
        .in("character_id", characterIds.length > 0 ? characterIds : ["__none__"]),
      supabase
        .from("rp_campaign_endings_seen")
        .select("campaign_id, ending_node_id")
        .eq("user_id", user.id),
    ]);

    const charList = characters || [];
    const sessionList = sessions || [];
    const proposalList = proposals || [];
    const progressList = progress || [];
    const endingsList = endingsSeen || [];

    // First Steps — Create your first character
    if (charList.length >= 1 && !hasBadgeByName("First Steps")) {
      await awardBadgeByName("First Steps");
    }

    // First Adventure — Complete first session
    const completedSessions = sessionList.filter(
      (s) => s.status === "completed"
    );
    if (
      completedSessions.length >= 1 &&
      !hasBadgeByName("First Adventure")
    ) {
      await awardBadgeByName("First Adventure");
    }

    // Storyteller — Complete 5 campaigns
    if (
      completedSessions.length >= 5 &&
      !hasBadgeByName("Storyteller")
    ) {
      await awardBadgeByName("Storyteller");
    }

    // Lorekeeper — Have a lore proposal approved
    const approvedProposals = proposalList.filter(
      (p) => p.status === "approved"
    );
    if (
      approvedProposals.length >= 1 &&
      !hasBadgeByName("Lorekeeper")
    ) {
      await awardBadgeByName("Lorekeeper");
    }

    // Lore Contributor
    if (
      approvedProposals.length >= 1 &&
      !hasBadgeByName("Lore Contributor")
    ) {
      await awardBadgeByName("Lore Contributor");
    }

    // Worldbuilder — 5 lore proposals approved
    if (
      approvedProposals.length >= 5 &&
      !hasBadgeByName("Worldbuilder")
    ) {
      await awardBadgeByName("Worldbuilder");
    }

    // Explorer — Visit 50 unique story nodes
    const allNodes = new Set<string>();
    for (const p of progressList) {
      const visited = p.nodes_visited as string[] | null;
      if (visited) {
        visited.forEach((n) => allNodes.add(n));
      }
    }
    if (allNodes.size >= 50 && !hasBadgeByName("Explorer")) {
      await awardBadgeByName("Explorer");
    }

    // Level milestones
    const maxLevel = Math.max(0, ...charList.map((c) => c.level));
    if (maxLevel >= 5 && !hasBadgeByName("Level 5 Adventurer")) {
      await awardBadgeByName("Level 5 Adventurer");
    }
    if (maxLevel >= 10 && !hasBadgeByName("Level 10 Hero")) {
      await awardBadgeByName("Level 10 Hero");
    }
    if (maxLevel >= 20 && !hasBadgeByName("Level 20 Legend")) {
      await awardBadgeByName("Level 20 Legend");
    }

    // Campaign Creator
    const { data: campaigns } = await supabase
      .from("rp_campaigns")
      .select("id")
      .eq("author_id", user.id)
      .eq("is_published", true);

    if (
      (campaigns?.length || 0) >= 1 &&
      !hasBadgeByName("Campaign Creator")
    ) {
      await awardBadgeByName("Campaign Creator");
    }

    // Charismatic — Pass 10 Charisma checks
    let totalCharismaChecks = 0;
    for (const p of progressList) {
      const statChecks = p.stat_checks_by_type as Record<string, number> | null;
      if (statChecks?.charisma) {
        totalCharismaChecks += statChecks.charisma;
      }
    }
    if (totalCharismaChecks >= 10 && !hasBadgeByName("Charismatic")) {
      await awardBadgeByName("Charismatic");
    }

    // Completionist — See all endings of a campaign
    // Group endings by campaign and check against total ending nodes
    const endingsByCampaign = new Map<string, Set<string>>();
    for (const e of endingsList) {
      if (!endingsByCampaign.has(e.campaign_id)) {
        endingsByCampaign.set(e.campaign_id, new Set());
      }
      endingsByCampaign.get(e.campaign_id)!.add(e.ending_node_id);
    }

    if (endingsByCampaign.size > 0 && !hasBadgeByName("Completionist")) {
      for (const [campaignId, seenEndings] of endingsByCampaign) {
        const { data: totalEndings } = await supabase
          .from("rp_story_nodes")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("node_type", "ending");

        if (totalEndings && totalEndings.length > 1 && seenEndings.size >= totalEndings.length) {
          await awardBadgeByName("Completionist");
          break;
        }
      }
    }
  }, [user, awardBadgeByName, hasBadgeByName]);

  return { checkAchievements };
};
