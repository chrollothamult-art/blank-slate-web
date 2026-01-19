import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPreferences {
  id: string;
  user_id: string;
  infinite_scroll_enabled: boolean;
  notifications_comments: boolean;
  notifications_likes: boolean;
  notifications_follows: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences = {
  infinite_scroll_enabled: false,
  notifications_comments: true,
  notifications_likes: true,
  notifications_follows: true,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching preferences:', error);
        throw error;
      }

      if (data) {
        setPreferences({
          id: data.id,
          user_id: data.user_id,
          infinite_scroll_enabled: data.infinite_scroll_enabled ?? false,
          notifications_comments: data.notifications_comments ?? true,
          notifications_likes: data.notifications_likes ?? true,
          notifications_follows: data.notifications_follows ?? true,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        // Create default preferences for new users
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
        } else if (newPrefs) {
          setPreferences({
            id: newPrefs.id,
            user_id: newPrefs.user_id,
            infinite_scroll_enabled: newPrefs.infinite_scroll_enabled ?? false,
            notifications_comments: newPrefs.notifications_comments ?? true,
            notifications_likes: newPrefs.notifications_likes ?? true,
            notifications_follows: newPrefs.notifications_follows ?? true,
            created_at: newPrefs.created_at,
            updated_at: newPrefs.updated_at,
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<Pick<UserPreferences, 'infinite_scroll_enabled' | 'notifications_comments' | 'notifications_likes' | 'notifications_follows'>>) => {
    if (!user) {
      console.error('No user found for updating preferences');
      return false;
    }

    try {
      // First check if preferences exist
      if (!preferences) {
        // Try to create them first
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences,
            ...updates,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
          return false;
        }

        if (newPrefs) {
          setPreferences({
            id: newPrefs.id,
            user_id: newPrefs.user_id,
            infinite_scroll_enabled: newPrefs.infinite_scroll_enabled ?? false,
            notifications_comments: newPrefs.notifications_comments ?? true,
            notifications_likes: newPrefs.notifications_likes ?? true,
            notifications_follows: newPrefs.notifications_follows ?? true,
            created_at: newPrefs.created_at,
            updated_at: newPrefs.updated_at,
          });
          return true;
        }
        return false;
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      setPreferences((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
    // Convenience getters
    infiniteScrollEnabled: preferences?.infinite_scroll_enabled ?? false,
    notificationsComments: preferences?.notifications_comments ?? true,
    notificationsLikes: preferences?.notifications_likes ?? true,
    notificationsFollows: preferences?.notifications_follows ?? true,
  };
};
