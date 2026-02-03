import { Card, CardContent } from "@/components/ui/card";
import { useReadingProgress, formatReadingTime } from "@/hooks/useReadingProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { useStreaks } from "@/hooks/useStreaks";
import { BookOpen, Trophy, Clock, Target, Flame, BookCheck } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardStats = () => {
  const { stats, loading: progressLoading } = useReadingProgress();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const { streak, loading: streakLoading } = useStreaks();

  const loading = progressLoading || achievementsLoading || streakLoading;

  const statItems = [
    {
      label: "Books Started",
      value: stats.totalBooksStarted,
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Books Completed",
      value: stats.totalBooksCompleted,
      icon: BookCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Time Reading",
      value: formatReadingTime(stats.totalTimeSpentSeconds),
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Avg. Progress",
      value: `${Math.round(stats.averageProgress)}%`,
      icon: Target,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Current Streak",
      value: `${streak?.current_streak || 0} days`,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Achievements",
      value: achievements.length,
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-lg mb-3" />
                  <div className="h-6 w-16 bg-muted rounded mb-1" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              ) : (
                <>
                  <div className={`h-10 w-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
