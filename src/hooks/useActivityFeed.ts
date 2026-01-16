import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  userId: string;
  userEmail: string;
  activityType: 'review' | 'reading_progress' | 'forum_post' | 'achievement' | 'book_purchase';
  referenceId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export const useActivityFeed = (feedType: 'following' | 'all' = 'following') => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchActivities = useCallback(async (reset = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const currentPage = reset ? 0 : page;
      
      if (feedType === 'following') {
        // First get who the user is following
        const { data: followingData } = await (supabase
          .from('user_follows' as any)
          .select('following_id')
          .eq('follower_id', user.id)) as any;

        const followingIds = followingData?.map((f: any) => f.following_id) || [];

        if (followingIds.length === 0) {
          setActivities([]);
          setLoading(false);
          setHasMore(false);
          return;
        }

        // Then get activities from followed users
        const { data: activitiesData, error } = await (supabase
          .from('user_activities' as any)
          .select('*')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)) as any;

        if (error) throw error;

        // Get usernames for activities
        const userIds: string[] = [...new Set(activitiesData?.map((a: any) => a.user_id) || [])] as string[];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) || []);

        const formattedActivities: Activity[] = (activitiesData || []).map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          userEmail: profileMap.get(a.user_id) || 'Anonymous',
          activityType: a.activity_type,
          referenceId: a.reference_id,
          metadata: a.metadata || {},
          createdAt: a.created_at,
        }));

        if (reset) {
          setActivities(formattedActivities);
        } else {
          setActivities((prev) => [...prev, ...formattedActivities]);
        }

        setHasMore(formattedActivities.length === pageSize);
      } else {
        // All activities
        const { data: activitiesData, error } = await (supabase
          .from('user_activities' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)) as any;

        if (error) throw error;

        const userIds: string[] = [...new Set(activitiesData?.map((a: any) => a.user_id) || [])] as string[];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) || []);

        const formattedActivities: Activity[] = (activitiesData || []).map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          userEmail: profileMap.get(a.user_id) || 'Anonymous',
          activityType: a.activity_type,
          referenceId: a.reference_id,
          metadata: a.metadata || {},
          createdAt: a.created_at,
        }));

        if (reset) {
          setActivities(formattedActivities);
        } else {
          setActivities((prev) => [...prev, ...formattedActivities]);
        }

        setHasMore(formattedActivities.length === pageSize);
      }

      if (reset) {
        setPage(0);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user, feedType, page]);

  useEffect(() => {
    fetchActivities(true);
  }, [user, feedType]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchActivities();
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchActivities(true);
  };

  return {
    activities,
    loading,
    hasMore,
    loadMore,
    refresh,
  };
};
