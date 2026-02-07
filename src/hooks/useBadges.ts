import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BadgeType {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: BadgeType;
}

export const useBadges = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [badgeTypes, setBadgeTypes] = useState<BadgeType[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  const fetchBadges = useCallback(async () => {
    try {
      // Fetch all badge types
      const { data: types, error: typesError } = await supabase
        .from('badge_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (typesError) throw typesError;
      setBadgeTypes(types || []);

      // Fetch user's earned badges
      if (targetUserId) {
        const { data: earned, error: earnedError } = await supabase
          .from('user_badges')
          .select('*, badge:badge_types(*)')
          .eq('user_id', targetUserId)
          .order('earned_at', { ascending: false });

        if (earnedError) throw earnedError;
        setUserBadges((earned as unknown as UserBadge[]) || []);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const awardBadge = useCallback(async (badgeId: string) => {
    if (!user) return null;

    // Check if already earned
    const alreadyEarned = userBadges.some(b => b.badge_id === badgeId);
    if (alreadyEarned) return null;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: user.id, badge_id: badgeId })
        .select('*, badge:badge_types(*)')
        .single();

      if (error) {
        if (error.code === '23505') return null; // Already exists
        throw error;
      }

      const newBadge = data as unknown as UserBadge;
      setUserBadges(prev => [newBadge, ...prev]);

      // Show toast
      const badgeDef = badgeTypes.find(b => b.id === badgeId);
      if (badgeDef) {
        toast({
          title: '🏅 Badge Earned!',
          description: `${badgeDef.icon} ${badgeDef.name}: ${badgeDef.description}`,
        });
      }

      return newBadge;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return null;
    }
  }, [user, userBadges, badgeTypes, toast]);

  const awardBadgeByName = useCallback(async (badgeName: string) => {
    const badge = badgeTypes.find(b => b.name === badgeName);
    if (!badge) return null;
    return awardBadge(badge.id);
  }, [badgeTypes, awardBadge]);

  const hasBadge = useCallback((badgeId: string) => {
    return userBadges.some(b => b.badge_id === badgeId);
  }, [userBadges]);

  const hasBadgeByName = useCallback((badgeName: string) => {
    const badge = badgeTypes.find(b => b.name === badgeName);
    if (!badge) return false;
    return hasBadge(badge.id);
  }, [badgeTypes, hasBadge]);

  return {
    badgeTypes,
    userBadges,
    loading,
    awardBadge,
    awardBadgeByName,
    hasBadge,
    hasBadgeByName,
    refetch: fetchBadges,
  };
};
