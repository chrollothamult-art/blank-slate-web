import { useActivityFeed, Activity } from '@/hooks/useActivityFeed';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  BookOpen, 
  MessageSquare, 
  Trophy, 
  ShoppingBag,
  RefreshCw,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const getActivityIcon = (type: Activity['activityType']) => {
  switch (type) {
    case 'review':
      return <Star className="h-4 w-4 text-yellow-500" />;
    case 'reading_progress':
      return <BookOpen className="h-4 w-4 text-blue-500" />;
    case 'forum_post':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'achievement':
      return <Trophy className="h-4 w-4 text-amber-500" />;
    case 'book_purchase':
      return <ShoppingBag className="h-4 w-4 text-purple-500" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

const getActivityLabel = (type: Activity['activityType']) => {
  switch (type) {
    case 'review':
      return 'wrote a review';
    case 'reading_progress':
      return 'updated reading progress';
    case 'forum_post':
      return 'posted in forum';
    case 'achievement':
      return 'earned an achievement';
    case 'book_purchase':
      return 'purchased a book';
    default:
      return 'did something';
  }
};

const getActivityBadgeVariant = (type: Activity['activityType']) => {
  switch (type) {
    case 'review':
      return 'default';
    case 'reading_progress':
      return 'secondary';
    case 'forum_post':
      return 'outline';
    case 'achievement':
      return 'default';
    case 'book_purchase':
      return 'secondary';
    default:
      return 'outline';
  }
};

const ActivityItem = ({ activity, onUserClick }: { activity: Activity; onUserClick: (userId: string) => void }) => {
  const initials = activity.userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar 
        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={() => onUserClick(activity.userId)}
      >
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className="font-medium text-sm truncate cursor-pointer hover:text-primary hover:underline"
            onClick={() => onUserClick(activity.userId)}
          >
            {activity.userEmail.split('@')[0]}
          </span>
          <span className="text-muted-foreground text-sm">
            {getActivityLabel(activity.activityType)}
          </span>
          {getActivityIcon(activity.activityType)}
        </div>
        
        {activity.metadata?.title && (
          <p className="text-sm text-muted-foreground mt-1 truncate">
            "{activity.metadata.title}"
          </p>
        )}
        
        {activity.metadata?.achievement_name && (
          <Badge variant="default" className="mt-1">
            <Trophy className="h-3 w-3 mr-1" />
            {activity.metadata.achievement_name}
          </Badge>
        )}
        
        {activity.metadata?.progress !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            Progress: {activity.metadata.progress}%
          </p>
        )}
        
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </p>
      </div>
      
      <Badge variant={getActivityBadgeVariant(activity.activityType) as any} className="shrink-0">
        {activity.activityType.replace('_', ' ')}
      </Badge>
    </div>
  );
};

const ActivitySkeleton = () => (
  <div className="flex items-start gap-3 p-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const ActivityFeed = () => {
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState<'following' | 'all'>('following');
  const { activities, loading, hasMore, loadMore, refresh } = useActivityFeed(feedType);

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'following' | 'all')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="all">All Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value={feedType} className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              {loading && activities.length === 0 ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <ActivitySkeleton key={i} />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No activity yet</p>
                  <p className="text-sm mt-1">
                    {feedType === 'following'
                      ? 'Follow some readers to see their activity here'
                      : 'Be the first to create some activity!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} onUserClick={handleUserClick} />
                  ))}
                  
                  {hasMore && (
                    <Button
                      variant="ghost"
                      className="w-full mt-2"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
