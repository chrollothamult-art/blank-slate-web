import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollows } from '@/hooks/useFollows';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const FollowButton = ({
  targetUserId,
  initialIsFollowing = false,
  size = 'sm',
  variant = 'outline',
}: FollowButtonProps) => {
  const { followUser, unfollowUser, isFollowing } = useFollows();
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(initialIsFollowing || isFollowing(targetUserId));

  const handleClick = async () => {
    setLoading(true);
    try {
      if (following) {
        const success = await unfollowUser(targetUserId);
        if (success) setFollowing(false);
      } else {
        const success = await followUser(targetUserId);
        if (success) setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={following ? 'outline' : variant}
      onClick={handleClick}
      disabled={loading}
      className={following ? 'border-primary text-primary hover:bg-destructive hover:text-destructive-foreground hover:border-destructive' : ''}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Follow</span>
        </>
      )}
    </Button>
  );
};
