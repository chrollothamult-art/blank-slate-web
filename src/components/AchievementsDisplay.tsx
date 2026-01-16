import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AchievementsDisplayProps {
  className?: string;
  showLocked?: boolean;
  compact?: boolean;
}

export const AchievementsDisplay = ({ 
  className, 
  showLocked = true, 
  compact = false 
}: AchievementsDisplayProps) => {
  const { achievements, loading, hasAchievement, definitions } = useAchievements();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedCount = achievements.length;
  const totalCount = definitions.length;

  const getEarnedDate = (type: string) => {
    const achievement = achievements.find(a => a.achievement_type === type);
    return achievement ? new Date(achievement.earned_at) : null;
  };

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {achievements.slice(0, 6).map((achievement) => {
          const def = definitions.find(d => d.type === achievement.achievement_type);
          if (!def) return null;
          return (
            <Badge 
              key={achievement.id} 
              variant="secondary"
              className={cn('text-lg py-1', def.color, 'text-white')}
            >
              {def.icon}
            </Badge>
          );
        })}
        {achievements.length > 6 && (
          <Badge variant="outline">+{achievements.length - 6} more</Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Achievements
          <Badge variant="secondary">{earnedCount}/{totalCount}</Badge>
        </CardTitle>
        <CardDescription>
          Your reading milestones and accomplishments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {definitions.map((def) => {
            const isEarned = hasAchievement(def.type);
            const earnedDate = getEarnedDate(def.type);

            if (!showLocked && !isEarned) return null;

            return (
              <div
                key={def.type}
                className={cn(
                  'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                  isEarned 
                    ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
                    : 'border-muted bg-muted/30 opacity-50 grayscale'
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2',
                    isEarned ? def.color : 'bg-muted'
                  )}
                >
                  {isEarned ? def.icon : '🔒'}
                </div>
                <p className="font-semibold text-sm text-center leading-tight">
                  {def.name}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {def.description}
                </p>
                {earnedDate && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {format(earnedDate, 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
