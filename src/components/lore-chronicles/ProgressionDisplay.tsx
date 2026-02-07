import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProgression, RpLevelBenefit } from "@/hooks/useProgression";

interface ProgressionDisplayProps {
  characterId: string;
  currentXp: number;
  currentLevel: number;
}

export const ProgressionDisplay = ({ 
  characterId, 
  currentXp, 
  currentLevel 
}: ProgressionDisplayProps) => {
  const { levelBenefits, getLevelInfo, loading } = useProgression(characterId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading progression...</div>
        </CardContent>
      </Card>
    );
  }

  const levelInfo = getLevelInfo(currentXp);
  const xpInCurrentLevel = currentXp - levelInfo.xpForCurrentLevel;
  const xpNeededForNext = levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel;
  const progressPercent = xpNeededForNext > 0 
    ? Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100) 
    : 100;

  // Get next few level benefits
  const upcomingBenefits = levelBenefits
    .filter(lb => lb.level > currentLevel)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Progression
        </CardTitle>
        <CardDescription>
          Your journey of growth and power
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 overflow-hidden">
          <div className="absolute top-2 right-2">
            <Sparkles className="h-16 w-16 text-primary/10" />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <span className="text-2xl font-bold text-primary">{currentLevel}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Level</p>
              {levelInfo.title && (
                <p className="text-lg font-semibold">{levelInfo.title}</p>
              )}
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Experience</span>
              <span className="font-medium">{currentXp} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{xpInCurrentLevel} / {xpNeededForNext} to next level</span>
              {levelInfo.nextTitle && (
                <span className="text-primary">Next: {levelInfo.nextTitle}</span>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Level Benefits */}
        {upcomingBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Upcoming Rewards
            </h4>
            <div className="space-y-2">
              {upcomingBenefits.map((benefit) => (
                <LevelBenefitCard 
                  key={benefit.id} 
                  benefit={benefit} 
                  currentXp={currentXp}
                />
              ))}
            </div>
          </div>
        )}

        {/* XP Earning Guide */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            How to Earn XP
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complete node</span>
              <Badge variant="secondary" className="text-xs">+5 XP</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Make choice</span>
              <Badge variant="secondary" className="text-xs">+10 XP</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pass stat check</span>
              <Badge variant="secondary" className="text-xs">+20 XP</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complete campaign</span>
              <Badge variant="secondary" className="text-xs">+100 XP</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LevelBenefitCard = ({ 
  benefit, 
  currentXp 
}: { 
  benefit: RpLevelBenefit; 
  currentXp: number;
}) => {
  const xpRemaining = benefit.xp_required - currentXp;
  const isClose = xpRemaining <= 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isClose 
          ? 'border-primary/50 bg-primary/5' 
          : 'border-border bg-muted/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isClose ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {benefit.level}
        </div>
        <div>
          <p className="font-medium text-sm">
            {benefit.title || `Level ${benefit.level}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {benefit.description || `+${benefit.stat_points_granted} stat points`}
          </p>
        </div>
      </div>
      <Badge variant={isClose ? "default" : "outline"} className="text-xs">
        {xpRemaining} XP
      </Badge>
    </motion.div>
  );
};

export default ProgressionDisplay;
