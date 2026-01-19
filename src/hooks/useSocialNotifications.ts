import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from './useUserPreferences';

export interface SocialNotification {
  id: string;
  user_id: string;
  triggered_by_user_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'reply';
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
  triggered_by_user?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useSocialNotifications = () => {
  const { user } = useAuth();
  const { notificationsComments, notificationsLikes, notificationsFollows } = useUserPreferences();
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('social_notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)) as any;

      if (error) throw error;

      if (data) {
        // Fetch triggered user profiles
        const userIds: string[] = Array.from(new Set(data.filter((n: any) => n.triggered_by_user_id).map((n: any) => n.triggered_by_user_id))) as string[];
        let profileMap = new Map();

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
        }

        // Filter based on preferences and enrich with user data
        const enrichedNotifications = data
          .filter((n: any) => {
            if (n.type === 'comment' || n.type === 'reply') return notificationsComments;
            if (n.type === 'like') return notificationsLikes;
            if (n.type === 'follow') return notificationsFollows;
            return true;
          })
          .map((n: any) => ({
            ...n,
            triggered_by_user: profileMap.get(n.triggered_by_user_id) || undefined,
          }));

        setNotifications(enrichedNotifications);
        setUnreadCount(enrichedNotifications.filter((n: SocialNotification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching social notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, notificationsComments, notificationsLikes, notificationsFollows]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('social_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as SocialNotification;
          
          // Check if notification type is enabled
          const shouldShow = 
            (newNotification.type === 'comment' || newNotification.type === 'reply') ? notificationsComments :
            newNotification.type === 'like' ? notificationsLikes :
            newNotification.type === 'follow' ? notificationsFollows : true;

          if (shouldShow) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, notificationsComments, notificationsLikes, notificationsFollows]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await (supabase
        .from('social_notifications' as any)
        .update({ is_read: true })
        .eq('id', notificationId)) as any;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await (supabase
        .from('social_notifications' as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)) as any;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (
    targetUserId: string,
    type: 'like' | 'comment' | 'follow' | 'reply',
    message: string,
    referenceId?: string,
    referenceType?: string
  ) => {
    if (!user || targetUserId === user.id) return; // Don't notify self

    try {
      await (supabase
        .from('social_notifications' as any)
        .insert({
          user_id: targetUserId,
          triggered_by_user_id: user.id,
          type,
          message,
          reference_id: referenceId || null,
          reference_type: referenceType || null,
        })) as any;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications,
  };
};
