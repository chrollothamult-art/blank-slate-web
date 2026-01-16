import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FollowStats {
  followersCount: number;
  followingCount: number;
}

interface UserToFollow {
  id: string;
  email: string;
  isFollowing: boolean;
}

export const useFollows = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [stats, setStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<UserToFollow[]>([]);

  const fetchFollowData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch who the user is following
      const { data: followingData } = await (supabase
        .from('user_follows' as any)
        .select('following_id')
        .eq('follower_id', user.id)) as any;

      // Fetch user's followers
      const { data: followersData } = await (supabase
        .from('user_follows' as any)
        .select('follower_id')
        .eq('following_id', user.id)) as any;

      const followingIds = followingData?.map((f: any) => f.following_id) || [];
      const followerIds = followersData?.map((f: any) => f.follower_id) || [];

      setFollowing(followingIds);
      setFollowers(followerIds);
      setStats({
        followersCount: followerIds.length,
        followingCount: followingIds.length,
      });
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSuggestedUsers = useCallback(async () => {
    if (!user) return;

    try {
      // Get profiles that the user is not following
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .neq('id', user.id)
        .limit(10);

      if (profiles) {
        const usersWithFollowStatus = profiles.map((profile) => ({
          id: profile.id,
          email: profile.username || 'Anonymous User',
          isFollowing: following.includes(profile.id),
        }));
        setSuggestedUsers(usersWithFollowStatus);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  }, [user, following]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  useEffect(() => {
    if (!loading) {
      fetchSuggestedUsers();
    }
  }, [loading, fetchSuggestedUsers]);

  const followUser = async (targetUserId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await (supabase
        .from('user_follows' as any)
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        })) as any;

      if (error) throw error;

      setFollowing((prev) => [...prev, targetUserId]);
      setStats((prev) => ({ ...prev, followingCount: prev.followingCount + 1 }));
      setSuggestedUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: true } : u))
      );

      toast({
        title: 'Following!',
        description: 'You are now following this user',
      });

      // Log activity
      await logActivity('follow', targetUserId, { followed_user_id: targetUserId });

      return true;
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: 'Error',
        description: 'Could not follow user',
        variant: 'destructive',
      });
      return false;
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return false;

    try {
      const { error } = await (supabase
        .from('user_follows' as any)
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)) as any;

      if (error) throw error;

      setFollowing((prev) => prev.filter((id) => id !== targetUserId));
      setStats((prev) => ({ ...prev, followingCount: prev.followingCount - 1 }));
      setSuggestedUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: false } : u))
      );

      toast({
        title: 'Unfollowed',
        description: 'You have unfollowed this user',
      });

      return true;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  };

  const isFollowing = (targetUserId: string) => {
    return following.includes(targetUserId);
  };

  const logActivity = async (
    activityType: string,
    referenceId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await (supabase.from('user_activities' as any).insert({
        user_id: user.id,
        activity_type: activityType,
        reference_id: referenceId,
        metadata: metadata || {},
      })) as any;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return {
    following,
    followers,
    stats,
    loading,
    suggestedUsers,
    followUser,
    unfollowUser,
    isFollowing,
    logActivity,
    refetch: fetchFollowData,
  };
};
