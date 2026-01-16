import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  earned_at: string;
  metadata: Record<string, unknown>;
}

export interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { type: 'first_book_started', name: 'First Steps', description: 'Started reading your first book', icon: '📖', color: 'bg-blue-500' },
  { type: 'first_book_finished', name: 'Finisher', description: 'Completed your first book', icon: '🏆', color: 'bg-yellow-500' },
  { type: 'streak_7', name: 'Week Warrior', description: 'Read for 7 days in a row', icon: '🔥', color: 'bg-orange-500' },
  { type: 'streak_14', name: 'Fortnight Reader', description: 'Read for 14 days in a row', icon: '💪', color: 'bg-red-500' },
  { type: 'streak_30', name: 'Monthly Master', description: 'Read for 30 days in a row', icon: '👑', color: 'bg-purple-500' },
  { type: 'streak_60', name: 'Dedication', description: 'Read for 60 days in a row', icon: '⭐', color: 'bg-indigo-500' },
  { type: 'streak_100', name: 'Century Reader', description: 'Read for 100 days in a row', icon: '💎', color: 'bg-pink-500' },
  { type: 'speed_reader', name: 'Speed Reader', description: 'Finished a book in under 3 days', icon: '⚡', color: 'bg-cyan-500' },
  { type: 'night_owl', name: 'Night Owl', description: 'Read after midnight', icon: '🦉', color: 'bg-slate-600' },
  { type: 'early_bird', name: 'Early Bird', description: 'Read before 6 AM', icon: '🐦', color: 'bg-amber-500' },
  { type: 'bookworm', name: 'Bookworm', description: 'Finished 5 books', icon: '🐛', color: 'bg-green-500' },
  { type: 'library_builder', name: 'Library Builder', description: 'Purchased 10 books', icon: '📚', color: 'bg-teal-500' },
  { type: 'reviewer', name: 'Critic', description: 'Left your first review', icon: '✍️', color: 'bg-violet-500' },
  { type: 'social_reader', name: 'Social Reader', description: 'Joined the forum', icon: '💬', color: 'bg-rose-500' },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('user_achievements' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })) as { data: Achievement[] | null; error: any };

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockAchievement = useCallback(async (
    achievementType: string, 
    metadata: Record<string, unknown> = {},
    showToast: boolean = true
  ) => {
    if (!user) return null;

    // Check if already earned
    const alreadyEarned = achievements.some(a => a.achievement_type === achievementType);
    if (alreadyEarned) return null;

    try {
      const { data, error } = await (supabase
        .from('user_achievements' as any)
        .insert({
          user_id: user.id,
          achievement_type: achievementType,
          metadata,
        })
        .select()
        .single()) as { data: Achievement; error: any };

      if (error) {
        // Handle unique constraint violation (already exists)
        if (error.code === '23505') return null;
        throw error;
      }

      setAchievements(prev => [data, ...prev]);

      // Show toast notification
      if (showToast) {
        const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.type === achievementType);
        if (definition) {
          toast({
            title: `🎉 Achievement Unlocked!`,
            description: `${definition.icon} ${definition.name}: ${definition.description}`,
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }, [user, achievements, toast]);

  const hasAchievement = useCallback((achievementType: string) => {
    return achievements.some(a => a.achievement_type === achievementType);
  }, [achievements]);

  const getAchievementDetails = useCallback((achievement: Achievement) => {
    return ACHIEVEMENT_DEFINITIONS.find(d => d.type === achievement.achievement_type);
  }, []);

  const checkTimeBasedAchievements = useCallback(async () => {
    const now = new Date();
    const hour = now.getHours();

    // Night Owl: Reading after midnight (0-4 AM)
    if (hour >= 0 && hour < 4 && !hasAchievement('night_owl')) {
      await unlockAchievement('night_owl');
    }

    // Early Bird: Reading before 6 AM (4-6 AM)
    if (hour >= 4 && hour < 6 && !hasAchievement('early_bird')) {
      await unlockAchievement('early_bird');
    }
  }, [hasAchievement, unlockAchievement]);

  return {
    achievements,
    loading,
    unlockAchievement,
    hasAchievement,
    getAchievementDetails,
    checkTimeBasedAchievements,
    refetch: fetchAchievements,
    definitions: ACHIEVEMENT_DEFINITIONS,
  };
};
