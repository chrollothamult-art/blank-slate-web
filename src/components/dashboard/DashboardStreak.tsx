import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStreaks } from "@/hooks/useStreaks";
import { Flame, AlertTriangle, Calendar, Award } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";

export const DashboardStreak = () => {
  const { streak, loading, isStreakAtRisk } = useStreaks();

  const atRisk = isStreakAtRisk();

  // Generate last 7 days for streak visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayName = format(date, "EEE");
    const isToday = i === 6;
    
    // Simple check: if we have a streak and last_read_date, check if this day was a reading day
    let wasReadingDay = false;
    if (streak?.last_read_date && streak.current_streak > 0) {
      const lastReadDate = new Date(streak.last_read_date);
      const daysDiff = Math.floor((lastReadDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      wasReadingDay = daysDiff >= 0 && daysDiff < streak.current_streak;
    }

    return { date, dateStr, dayName, isToday, wasReadingDay };
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Reading Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-10 w-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={atRisk ? "border-orange-500/50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${streak?.current_streak ? "text-orange-500" : "text-muted-foreground"}`} />
          Reading Streak
          {atRisk && (
            <span className="ml-auto flex items-center gap-1 text-orange-500 text-sm font-normal">
              <AlertTriangle className="h-4 w-4" />
              At Risk
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Streak Display */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="relative inline-block">
            <div className={`text-6xl font-bold ${streak?.current_streak ? "text-orange-500" : "text-muted-foreground"}`}>
              {streak?.current_streak || 0}
            </div>
            <Flame className={`absolute -top-2 -right-6 h-8 w-8 ${streak?.current_streak ? "text-orange-400 animate-pulse" : "text-muted-foreground/30"}`} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">day streak</div>
        </motion.div>

        {/* Week Visualization */}
        <div className="flex justify-between gap-1">
          {last7Days.map((day, index) => (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  day.wasReadingDay
                    ? "bg-orange-500 text-white"
                    : day.isToday
                    ? "bg-muted border-2 border-dashed border-primary"
                    : "bg-muted/50"
                }`}
              >
                {day.wasReadingDay ? (
                  <Flame className="h-5 w-5" />
                ) : day.isToday ? (
                  <span className="text-xs font-medium">?</span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
              <span className={`text-xs ${day.isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {day.dayName}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Award className="h-4 w-4" />
            </div>
            <div className="text-lg font-semibold">{streak?.longest_streak || 0}</div>
            <div className="text-xs text-muted-foreground">Longest</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-lg font-semibold">
              {streak?.last_read_date 
                ? format(new Date(streak.last_read_date), "MMM d")
                : "-"
              }
            </div>
            <div className="text-xs text-muted-foreground">Last Read</div>
          </div>
        </div>

        {/* Motivational Message */}
        {atRisk && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-orange-500/10 text-center"
          >
            <p className="text-sm text-orange-600 dark:text-orange-400">
              🔥 Read today to keep your streak alive!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
