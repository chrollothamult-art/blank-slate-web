import { Flame, AlertTriangle } from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge = ({ className, showTooltip = true, size = 'md' }: StreakBadgeProps) => {
  const { user } = useAuth();
  const { streak, loading, isStreakAtRisk } = useStreaks();

  if (!user || loading) return null;

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const atRisk = isStreakAtRisk();

  if (currentStreak === 0 && !atRisk) return null;

  const sizeClasses = {
    sm: 'h-6 px-1.5 text-xs gap-0.5',
    md: 'h-8 px-2 text-sm gap-1',
    lg: 'h-10 px-3 text-base gap-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badge = (
    <div
      className={cn(
        'flex items-center rounded-full font-medium transition-all',
        atRisk 
          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse' 
          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25',
        sizeClasses[size],
        className
      )}
    >
      {atRisk ? (
        <AlertTriangle className={iconSizes[size]} />
      ) : (
        <Flame className={cn(iconSizes[size], 'animate-bounce')} style={{ animationDuration: '2s' }} />
      )}
      <span className="font-bold">{currentStreak}</span>
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-semibold">
            {atRisk ? '⚠️ Streak at risk!' : `🔥 ${currentStreak} day streak!`}
          </p>
          <p className="text-xs text-muted-foreground">
            {atRisk 
              ? 'Read today to keep your streak!'
              : `Longest streak: ${longestStreak} days`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
