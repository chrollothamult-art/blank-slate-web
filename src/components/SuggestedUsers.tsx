import { useNavigate } from 'react-router-dom';
import { useFollows } from '@/hooks/useFollows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from '@/components/FollowButton';
import { UserPlus, Users } from 'lucide-react';

export const SuggestedUsers = () => {
  const navigate = useNavigate();
  const { suggestedUsers, loading, stats } = useFollows();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Suggested Readers
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{stats.followingCount} following</span>
          <span>{stats.followersCount} followers</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Check back later for new readers to follow</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedUsers.map((user) => {
                const initials = user.email
                  .split('@')[0]
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar 
                      className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium text-sm truncate cursor-pointer hover:text-primary hover:underline"
                        onClick={() => navigate(`/profile/${user.id}`)}
                      >
                        {user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <FollowButton
                      targetUserId={user.id}
                      initialIsFollowing={user.isFollowing}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
