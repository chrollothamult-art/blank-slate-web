import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
  });

  // Check if browser supports notifications
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'default',
        loading: false,
      }));
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isSubscribed: permission === 'granted',
      }));

      if (permission === 'granted') {
        // Store preference locally
        localStorage.setItem('push_notifications_enabled', 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  // Show a browser notification
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> => {
    if (!state.isSupported || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Check if we have a service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        
        // Use service worker notification for better features
        await registration.showNotification(title, {
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: 'thouart-notification',
          ...options,
        } as NotificationOptions);
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/favicon.png',
          ...options,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [state.isSupported]);

  // Disable push notifications
  const disableNotifications = useCallback(() => {
    localStorage.removeItem('push_notifications_enabled');
    setState(prev => ({
      ...prev,
      isSubscribed: false,
    }));
  }, []);

  // Check stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('push_notifications_enabled');
    if (stored === 'true' && Notification.permission === 'granted') {
      setState(prev => ({
        ...prev,
        isSubscribed: true,
      }));
    }
  }, []);

  return {
    ...state,
    requestPermission,
    showNotification,
    disableNotifications,
    canShowNotifications: state.isSupported && state.permission === 'granted',
  };
};

// Helper to format notification messages
export const formatNotificationMessage = (type: string, username?: string): string => {
  switch (type) {
    case 'like':
      return `${username || 'Someone'} liked your post`;
    case 'comment':
      return `${username || 'Someone'} commented on your post`;
    case 'reply':
      return `${username || 'Someone'} replied to your comment`;
    case 'follow':
      return `${username || 'Someone'} started following you`;
    case 'mention':
      return `${username || 'Someone'} mentioned you`;
    default:
      return 'You have a new notification';
  }
};
