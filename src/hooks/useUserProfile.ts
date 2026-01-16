import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserStats {
  totalBooksStarted: number;
  totalBooksCompleted: number;
  totalTimeSpentSeconds: number;
  averageProgress: number;
  achievementsCount: number;
  followersCount: number;
  followingCount: number;
}

interface UserActivity {
  id: string;
  activity_type: string;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useUserProfile = (userId?: string) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalBooksStarted: 0,
    totalBooksCompleted: 0,
    totalTimeSpentSeconds: 0,
    averageProgress: 0,
    achievementsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const targetUserId = userId || currentUser?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    setIsOwnProfile(currentUser?.id === targetUserId);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch reading progress stats
      const { data: progressData } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", targetUserId);

      if (progressData) {
        const totalBooksStarted = progressData.length;
        const totalBooksCompleted = progressData.filter(p => p.completed).length;
        const totalTimeSpentSeconds = progressData.reduce((acc, p) => acc + (p.time_spent_seconds || 0), 0);
        const averageProgress = progressData.length > 0 
          ? progressData.reduce((acc, p) => acc + Number(p.progress_percentage || 0), 0) / progressData.length 
          : 0;

        // Fetch achievements count
        const { count: achievementsCount } = await (supabase
          .from("user_achievements" as any)
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId)) as { count: number | null };

        // Fetch followers count
        const { count: followersCount } = await (supabase
          .from("user_follows" as any)
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetUserId)) as { count: number | null };

        // Fetch following count
        const { count: followingCount } = await (supabase
          .from("user_follows" as any)
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetUserId)) as { count: number | null };

        setStats({
          totalBooksStarted,
          totalBooksCompleted,
          totalTimeSpentSeconds,
          averageProgress,
          achievementsCount: achievementsCount || 0,
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
        });
      }

      // Fetch recent activities
      const { data: activityData } = await (supabase
        .from("user_activities" as any)
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(20)) as { data: UserActivity[] | null };

      setActivities(activityData || []);

      // Fetch wishlist (only for own profile or if public)
      if (currentUser?.id === targetUserId) {
        const { data: wishlistData } = await supabase
          .from("wishlists")
          .select("book_id")
          .eq("user_id", targetUserId);

        setWishlistItems(wishlistData?.map(w => w.book_id) || []);
      }

    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, currentUser?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    stats,
    activities,
    wishlistItems,
    loading,
    isOwnProfile,
    refetch: fetchProfile,
  };
};
