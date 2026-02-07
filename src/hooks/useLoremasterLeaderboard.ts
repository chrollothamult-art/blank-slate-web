import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LoremasterLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  reviews_completed: number;
  approved_count: number;
  rejected_count: number;
  appointed_at: string;
}

export const useLoremasterLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LoremasterLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      // Get all loremasters
      const { data: loremasters, error: lmError } = await supabase
        .from("rp_loremasters")
        .select("user_id, appointed_at");

      if (lmError || !loremasters?.length) {
        setLoading(false);
        return;
      }

      const userIds = loremasters.map((lm) => lm.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      // Get review counts per reviewer
      const { data: allReviews } = await supabase
        .from("rp_lore_proposals")
        .select("reviewer_id, status")
        .not("reviewer_id", "is", null)
        .in("reviewer_id", userIds);

      // Aggregate review counts
      const reviewCounts = new Map<string, { total: number; approved: number; rejected: number }>();
      for (const review of allReviews || []) {
        if (!review.reviewer_id) continue;
        const existing = reviewCounts.get(review.reviewer_id) || { total: 0, approved: 0, rejected: 0 };
        existing.total++;
        if (review.status === "approved") existing.approved++;
        if (review.status === "rejected") existing.rejected++;
        reviewCounts.set(review.reviewer_id, existing);
      }

      const entries: LoremasterLeaderboardEntry[] = loremasters.map((lm) => {
        const profile = profilesMap.get(lm.user_id);
        const counts = reviewCounts.get(lm.user_id) || { total: 0, approved: 0, rejected: 0 };
        
        return {
          user_id: lm.user_id,
          username: profile?.username || "Unknown",
          avatar_url: profile?.avatar_url || null,
          reviews_completed: counts.total,
          approved_count: counts.approved,
          rejected_count: counts.rejected,
          appointed_at: lm.appointed_at,
        };
      });

      // Sort by reviews completed
      entries.sort((a, b) => b.reviews_completed - a.reviews_completed);
      setLeaderboard(entries);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return { leaderboard, loading };
};
