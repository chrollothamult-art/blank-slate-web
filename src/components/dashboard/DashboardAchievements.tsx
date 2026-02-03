import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAchievements, ACHIEVEMENT_DEFINITIONS } from "@/hooks/useAchievements";
import { Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

export const DashboardAchievements = () => {
  const { achievements, loading } = useAchievements();

  const earnedTypes = new Set(achievements.map((a) => a.achievement_type));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-lg mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {achievements.length}/{ACHIEVEMENT_DEFINITIONS.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {ACHIEVEMENT_DEFINITIONS.map((definition, index) => {
            const isEarned = earnedTypes.has(definition.type);
            const earnedAchievement = achievements.find(
              (a) => a.achievement_type === definition.type
            );

            return (
              <motion.div
                key={definition.type}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`relative h-12 w-12 mx-auto rounded-lg flex items-center justify-center text-xl cursor-pointer transition-all ${
                        isEarned
                          ? `${definition.color} shadow-lg hover:scale-110`
                          : "bg-muted/50 grayscale opacity-40 hover:opacity-60"
                      }`}
                    >
                      {isEarned ? (
                        <span>{definition.icon}</span>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="text-center">
                      <div className="font-semibold">{definition.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {definition.description}
                      </div>
                      {earnedAchievement && (
                        <div className="text-xs text-green-500 mt-1">
                          Earned {formatDistanceToNow(new Date(earnedAchievement.earned_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Achievement */}
        {achievements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Latest Achievement</div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/10">
              <span className="text-2xl">
                {ACHIEVEMENT_DEFINITIONS.find((d) => d.type === achievements[0].achievement_type)?.icon}
              </span>
              <div>
                <div className="font-medium text-sm">
                  {ACHIEVEMENT_DEFINITIONS.find((d) => d.type === achievements[0].achievement_type)?.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(achievements[0].earned_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
