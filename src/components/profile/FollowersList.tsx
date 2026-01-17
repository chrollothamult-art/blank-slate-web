import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface FollowUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  followed_at: string;
  isFollowing?: boolean;
}

interface FollowersListProps {
  userId: string;
  isOwnProfile: boolean;
  username: string;
  followersCount: number;
  followingCount: number;
}

export const FollowersList = ({
  userId,
  isOwnProfile,
  username,
  followersCount,
  followingCount,
}: FollowersListProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);

  useEffect(() => {
    const fetchFollowData = async () => {
      setLoading(true);
      try {
        // Fetch followers
        const { data: followersData } = await supabase
          .from('user_follows')
          .select('follower_id, created_at')
          .eq('following_id', userId);

        // Fetch following
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id, created_at')
          .eq('follower_id', userId);

        // Get current user's following list for follow button state
        if (currentUser) {
          const { data: myFollowing } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);
          setCurrentUserFollowing(myFollowing?.map(f => f.following_id) || []);
        }

        // Get unique user IDs
        const followerIds = followersData?.map(f => f.follower_id) || [];
        const followingIds = followingData?.map(f => f.following_id) || [];
        const allUserIds = [...new Set([...followerIds, ...followingIds])];

        if (allUserIds.length === 0) {
          setFollowers([]);
          setFollowing([]);
          setLoading(false);
          return;
        }

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', allUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Build followers list
        const followersWithProfiles: FollowUser[] = (followersData || [])
          .filter(f => profileMap.has(f.follower_id))
          .map(f => {
            const profile = profileMap.get(f.follower_id)!;
            return {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              followed_at: f.created_at,
            };
          });

        // Build following list
        const followingWithProfiles: FollowUser[] = (followingData || [])
          .filter(f => profileMap.has(f.following_id))
          .map(f => {
            const profile = profileMap.get(f.following_id)!;
            return {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              followed_at: f.created_at,
            };
          });

        setFollowers(followersWithProfiles);
        setFollowing(followingWithProfiles);
      } catch (error) {
        console.error('Error fetching follow data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, [userId, currentUser]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (currentUserFollowing.includes(targetUserId)) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId);
        setCurrentUserFollowing(prev => prev.filter(id => id !== targetUserId));
        toast({ title: 'Unfollowed' });
      } else {
        await supabase
          .from('user_follows')
          .insert({ follower_id: currentUser.id, following_id: targetUserId });
        setCurrentUserFollowing(prev => [...prev, targetUserId]);
        toast({ title: 'Following!' });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Could not update follow status',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (fullName: string | null, username: string) => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  const renderUserList = (users: FollowUser[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar
                className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(user.full_name, user.username)}
                </AvatarFallback>
              </Avatar>

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <p className="font-medium text-sm truncate hover:text-primary transition-colors">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>

              {currentUser && currentUser.id !== user.id && (
                <Button
                  variant={currentUserFollowing.includes(user.id) ? 'outline' : 'default'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow(user.id);
                  }}
                >
                  {currentUserFollowing.includes(user.id) ? (
                    <>
                      <UserMinus className="h-3 w-3 mr-1" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Connections
        </CardTitle>
        <CardDescription>
          {isOwnProfile ? 'Your' : `${username}'s`} followers and following
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="followers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({followingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            {renderUserList(
              followers,
              isOwnProfile ? 'No followers yet' : `${username} has no followers yet`
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {renderUserList(
              following,
              isOwnProfile ? 'Not following anyone yet' : `${username} is not following anyone yet`
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
