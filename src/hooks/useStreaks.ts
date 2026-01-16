import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReadingStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<ReadingStreak | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreak(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('reading_streaks' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()) as { data: ReadingStreak | null; error: any };

      if (error) throw error;
      setStreak(data);
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const recordReadingActivity = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      if (!streak) {
        // Create new streak record
        const { data, error } = await (supabase
          .from('reading_streaks' as any)
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_read_date: today,
          })
          .select()
          .single()) as { data: ReadingStreak; error: any };

        if (error) throw error;
        setStreak(data);
        return { isNewStreak: true, currentStreak: 1 };
      }

      // Already read today
      if (streak.last_read_date === today) {
        return { isNewStreak: false, currentStreak: streak.current_streak };
      }

      const lastReadDate = streak.last_read_date ? new Date(streak.last_read_date) : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrentStreak = 1;
      let streakContinued = false;

      if (streak.last_read_date === yesterdayStr) {
        // Continue streak
        newCurrentStreak = streak.current_streak + 1;
        streakContinued = true;
      }

      const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

      const { data, error } = await (supabase
        .from('reading_streaks' as any)
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_read_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()) as { data: ReadingStreak; error: any };

      if (error) throw error;
      setStreak(data);

      return { 
        isNewStreak: !streakContinued, 
        currentStreak: newCurrentStreak,
        streakContinued,
        milestoneReached: [7, 14, 30, 60, 100].includes(newCurrentStreak) ? newCurrentStreak : null
      };
    } catch (error) {
      console.error('Error recording reading activity:', error);
      return null;
    }
  }, [user, streak]);

  const isStreakAtRisk = useCallback(() => {
    if (!streak?.last_read_date) return false;
    
    const today = new Date().toISOString().split('T')[0];
    if (streak.last_read_date === today) return false;

    const lastRead = new Date(streak.last_read_date);
    const now = new Date();
    const diffTime = now.getTime() - lastRead.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays >= 1 && diffDays < 2;
  }, [streak]);

  return {
    streak,
    loading,
    recordReadingActivity,
    isStreakAtRisk,
    refetch: fetchStreak,
  };
};
