import { Flame, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

interface StreakCardProps {
  className?: string;
}

export const StreakCard = ({ className }: StreakCardProps) => {
  const { streak, loading, isStreakAtRisk } = useStreaks();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const lastReadDate = streak?.last_read_date ? new Date(streak.last_read_date) : null;
  const atRisk = isStreakAtRisk();

  // Calculate progress to next milestone
  const milestones = [7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > currentStreak) || 100;
  const prevMilestone = milestones.filter(m => m <= currentStreak).pop() || 0;
  const progressToNext = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return (
    <Card className={cn(atRisk && 'border-amber-500/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={cn('h-5 w-5', atRisk ? 'text-amber-500' : 'text-orange-500')} />
          Reading Streak
          {atRisk && (
            <span className="text-xs font-normal text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              At Risk!
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {atRisk 
            ? "Read today to keep your streak alive!" 
            : "Keep reading daily to build your streak"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Streak Display */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className={cn(
              'w-28 h-28 rounded-full flex flex-col items-center justify-center',
              'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30'
            )}>
              <span className="text-4xl font-bold">{currentStreak}</span>
              <span className="text-xs uppercase tracking-wider opacity-90">days</span>
            </div>
            {currentStreak > 0 && (
              <Flame 
                className="absolute -top-2 -right-2 h-8 w-8 text-orange-400 animate-bounce" 
                style={{ animationDuration: '2s' }}
              />
            )}
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {currentStreak > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextMilestone} days</span>
              <span className="font-medium">{currentStreak}/{nextMilestone}</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {lastReadDate 
                  ? differenceInDays(new Date(), lastReadDate) === 0 
                    ? 'Today'
                    : format(lastReadDate, 'MMM d')
                  : 'Never'}
              </p>
              <p className="text-xs text-muted-foreground">Last Read</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
