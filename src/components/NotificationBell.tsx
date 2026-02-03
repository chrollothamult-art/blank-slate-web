import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForumNotifications, ForumNotification } from "@/hooks/useForumNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageCircle, 
  ThumbsUp, 
  AtSign, 
  Check, 
  Trash2, 
  CheckCheck,
  CheckCircle,
  XCircle,
  Crown,
  Palette
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { usePushNotifications, formatNotificationMessage } from "@/hooks/usePushNotifications";

interface SubmissionNotification {
  id: string;
  submission_id: string | null;
  type: 'approved' | 'rejected' | 'featured';
  message: string;
  admin_notes: string | null;
  is_read: boolean;
  created_at: string;
}

const getForumNotificationIcon = (type: ForumNotification["type"]) => {
  switch (type) {
    case "reply":
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case "like":
      return <ThumbsUp className="h-4 w-4 text-pink-500" />;
    case "mention":
      return <AtSign className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const submissionNotificationConfig = {
  approved: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  featured: {
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notificationsComments, notificationsLikes, notificationsFollows } = useUserPreferences();
  const {
    notifications: forumNotifications,
    unreadCount: forumUnreadCount,
    loading: forumLoading,
    markAsRead: markForumAsRead,
    markAllAsRead: markAllForumAsRead,
    deleteNotification: deleteForumNotification,
  } = useForumNotifications();
  
  const { showNotification, canShowNotifications } = usePushNotifications();
  const lastNotificationIdRef = useRef<string | null>(null);
  
  const [submissionNotifications, setSubmissionNotifications] = useState<SubmissionNotification[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'forum' | 'submissions'>('all');

  // Filter forum notifications based on user preferences
  const filteredForumNotifications = useMemo(() => {
    return forumNotifications.filter(n => {
      if (n.type === 'reply' || n.type === 'mention') return notificationsComments;
      if (n.type === 'like') return notificationsLikes;
      return true; // Show other types by default
    });
  }, [forumNotifications, notificationsComments, notificationsLikes]);

  const filteredForumUnreadCount = filteredForumNotifications.filter(n => !n.is_read).length;
  const submissionUnreadCount = submissionNotifications.filter(n => !n.is_read).length;
  const totalUnreadCount = filteredForumUnreadCount + submissionUnreadCount;

  const fetchSubmissionNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase
        .from('submission_notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)) as any;

      if (error) throw error;
      setSubmissionNotifications((data as SubmissionNotification[]) || []);
    } catch (error) {
      console.error('Error fetching submission notifications:', error);
    } finally {
      setSubmissionLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubmissionNotifications();

    // Set up realtime subscription
    if (user) {
      const channel = supabase
        .channel('submission_notifications_bell')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'submission_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as SubmissionNotification;
            setSubmissionNotifications(prev => [newNotif, ...prev]);
            
            // Show browser push notification
            if (canShowNotifications && newNotif.id !== lastNotificationIdRef.current) {
              lastNotificationIdRef.current = newNotif.id;
              showNotification('ThouArt', {
                body: newNotif.message,
                tag: `submission-${newNotif.id}`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchSubmissionNotifications, user, canShowNotifications, showNotification]);

  // Listen for forum notifications and show browser push (only if that type is enabled)
  useEffect(() => {
    if (filteredForumNotifications.length > 0 && canShowNotifications) {
      const latestNotif = filteredForumNotifications[0];
      if (latestNotif && !latestNotif.is_read && latestNotif.id !== lastNotificationIdRef.current) {
        lastNotificationIdRef.current = latestNotif.id;
        showNotification('ThouArt - Forum', {
          body: latestNotif.message,
          tag: `forum-${latestNotif.id}`,
        });
      }
    }
  }, [filteredForumNotifications, canShowNotifications, showNotification]);

  const handleForumNotificationClick = async (notification: ForumNotification) => {
    if (!notification.is_read) {
      await markForumAsRead(notification.id);
    }
    
    if (notification.post_id) {
      navigate("/forum");
      setIsOpen(false);
    }
  };

  const handleSubmissionNotificationClick = async (notification: SubmissionNotification) => {
    if (!notification.is_read) {
      await (supabase
        .from('submission_notifications' as any)
        .update({ is_read: true })
        .eq('id', notification.id)) as any;

      setSubmissionNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    if (notification.submission_id) {
      setIsOpen(false);
      navigate(`/community/submission/${notification.submission_id}`);
    }
  };

  const markAllSubmissionAsRead = async () => {
    if (submissionUnreadCount === 0) return;

    const unreadIds = submissionNotifications.filter(n => !n.is_read).map(n => n.id);
    
    await (supabase
      .from('submission_notifications' as any)
      .update({ is_read: true })
      .in('id', unreadIds)) as any;

    setSubmissionNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkAllAsRead = async () => {
    await Promise.all([
      markAllForumAsRead(),
      markAllSubmissionAsRead(),
    ]);
  };

  const loading = forumLoading || submissionLoading;

  // Combine and sort all notifications (using filtered forum notifications)
  const allNotifications = [
    ...filteredForumNotifications.map(n => ({ ...n, notifType: 'forum' as const })),
    ...submissionNotifications.map(n => ({ ...n, notifType: 'submission' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'forum':
        return allNotifications.filter(n => n.notifType === 'forum');
      case 'submissions':
        return allNotifications.filter(n => n.notifType === 'submission');
      default:
        return allNotifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {totalUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7 gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9 rounded-none border-b">
            <TabsTrigger value="all" className="text-xs">
              All {totalUnreadCount > 0 && `(${totalUnreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="forum" className="text-xs">
              Forum {filteredForumUnreadCount > 0 && `(${filteredForumUnreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs">
              Content {submissionUnreadCount > 0 && `(${submissionUnreadCount})`}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be notified about forum activity and content submissions
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  if (notification.notifType === 'forum') {
                    const forumNotif = notification as ForumNotification & { notifType: 'forum' };
                    return (
                      <div
                        key={`forum-${forumNotif.id}`}
                        className={cn(
                          "p-4 flex gap-3 hover:bg-muted/50 cursor-pointer transition-colors",
                          !forumNotif.is_read && "bg-accent/5"
                        )}
                        onClick={() => handleForumNotificationClick(forumNotif)}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {getForumNotificationIcon(forumNotif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", !forumNotif.is_read && "font-medium")}>
                            {forumNotif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(forumNotif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!forumNotif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  } else {
                    const subNotif = notification as SubmissionNotification & { notifType: 'submission' };
                    const config = submissionNotificationConfig[subNotif.type];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={`sub-${subNotif.id}`}
                        className={cn(
                          "p-4 flex gap-3 hover:bg-muted/50 cursor-pointer transition-colors",
                          !subNotif.is_read && "bg-accent/5"
                        )}
                        onClick={() => handleSubmissionNotificationClick(subNotif)}
                      >
                        <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", config.bgColor)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", !subNotif.is_read && "font-medium")}>
                            {subNotif.message}
                          </p>
                          {subNotif.admin_notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              Note: {subNotif.admin_notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(subNotif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!subNotif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
