import { useBadges } from '@/hooks/useBadges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Lock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface BadgesDisplayProps {
  userId?: string;
  className?: string;
  showLocked?: boolean;
  compact?: boolean;
  maxVisible?: number;
}

export const BadgesDisplay = ({
  userId,
  className,
  showLocked = true,
  compact = false,
  maxVisible,
}: BadgesDisplayProps) => {
  const { badgeTypes, userBadges, loading } = useBadges(userId);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-12 rounded-lg mx-auto" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(b => b.badge_id));
  const displayBadges = maxVisible ? badgeTypes.slice(0, maxVisible) : badgeTypes;

  if (compact) {
    const earned = userBadges.slice(0, 8);
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {earned.map((ub) => {
          const def = badgeTypes.find(b => b.id === ub.badge_id);
          if (!def) return null;
          return (
            <Tooltip key={ub.id}>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-lg py-1 cursor-pointer">
                  {def.icon}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{def.name}</p>
                <p className="text-xs text-muted-foreground">{def.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {userBadges.length > 8 && (
          <Badge variant="outline">+{userBadges.length - 8} more</Badge>
        )}
        {userBadges.length === 0 && (
          <span className="text-sm text-muted-foreground">No badges earned yet</span>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Badges
          <Badge variant="secondary" className="ml-auto">
            {userBadges.length}/{badgeTypes.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Earn badges by completing quests, creating characters, and contributing lore
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {displayBadges.map((badge, index) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const earnedBadge = userBadges.find(b => b.badge_id === badge.id);

            if (!showLocked && !isEarned) return null;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'relative h-14 w-14 mx-auto rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all border-2',
                        isEarned
                          ? 'bg-primary/10 border-primary/40 shadow-md hover:scale-110 hover:shadow-lg'
                          : 'bg-muted/30 border-muted grayscale opacity-40 hover:opacity-60'
                      )}
                    >
                      {isEarned ? (
                        <span className="text-2xl">{badge.icon}</span>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <div className="text-center space-y-1">
                      <div className="font-semibold flex items-center justify-center gap-1">
                        <span>{badge.icon}</span> {badge.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {badge.description}
                      </div>
                      {earnedBadge && (
                        <div className="text-xs text-green-500">
                          Earned {formatDistanceToNow(new Date(earnedBadge.earned_at), { addSuffix: true })}
                        </div>
                      )}
                      {!isEarned && (
                        <div className="text-xs text-muted-foreground/70 italic">
                          Locked
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </div>

        {/* Latest badge */}
        {userBadges.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Latest Badge</div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
              <span className="text-2xl">
                {badgeTypes.find(b => b.id === userBadges[0].badge_id)?.icon}
              </span>
              <div>
                <div className="font-medium text-sm">
                  {badgeTypes.find(b => b.id === userBadges[0].badge_id)?.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(userBadges[0].earned_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
