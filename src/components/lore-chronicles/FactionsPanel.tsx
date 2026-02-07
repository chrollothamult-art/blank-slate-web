import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Minus, Crown, Swords } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProgression, RpCharacterFaction } from "@/hooks/useProgression";

interface FactionsPanelProps {
  characterId: string;
}

const rankIcons: Record<string, typeof Crown> = {
  hostile: Swords,
  unfriendly: TrendingDown,
  neutral: Minus,
  friendly: TrendingUp,
  honored: Crown,
  exalted: Crown,
};

const rankColors: Record<string, string> = {
  hostile: "text-red-500",
  unfriendly: "text-orange-500",
  neutral: "text-muted-foreground",
  friendly: "text-green-500",
  honored: "text-blue-500",
  exalted: "text-amber-500",
};

export const FactionsPanel = ({ characterId }: FactionsPanelProps) => {
  const { characterFactions, factions, loading, calculateRank } = useProgression(characterId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading factions...</div>
        </CardContent>
      </Card>
    );
  }

  // Combine character factions with all available factions
  const allFactions = factions.map(faction => {
    const characterFaction = characterFactions.find(cf => cf.faction_id === faction.id);
    return {
      faction,
      standing: characterFaction,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Faction Standing
        </CardTitle>
        <CardDescription>
          Your reputation with the world's factions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allFactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No factions discovered yet</p>
            <p className="text-sm">Explore campaigns to meet factions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allFactions.map((item, index) => (
              <FactionCard 
                key={item.faction.id}
                faction={item.faction}
                standing={item.standing}
                calculateRank={calculateRank}
                index={index}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FactionCard = ({
  faction,
  standing,
  calculateRank,
  index,
}: {
  faction: { id: string; name: string; description: string; color: string; reputation_levels: Record<string, number> };
  standing: RpCharacterFaction | undefined;
  calculateRank: (rep: number, levels?: Record<string, number>) => string;
  index: number;
}) => {
  const reputation = standing?.reputation ?? 0;
  const rank = standing?.rank || calculateRank(0, faction.reputation_levels);
  
  // Calculate progress within current rank
  const levels = faction.reputation_levels;
  const sortedLevels = Object.entries(levels).sort((a, b) => a[1] - b[1]);
  
  let currentLevelIndex = sortedLevels.findIndex(([r]) => r === rank);
  if (currentLevelIndex === -1) currentLevelIndex = 0;
  
  const currentThreshold = sortedLevels[currentLevelIndex]?.[1] ?? 0;
  const nextThreshold = sortedLevels[currentLevelIndex + 1]?.[1] ?? currentThreshold + 100;
  
  const progressInRank = reputation - currentThreshold;
  const rangeSize = nextThreshold - currentThreshold;
  const progressPercent = rangeSize > 0 
    ? Math.max(0, Math.min((progressInRank / rangeSize) * 100, 100))
    : 100;

  const IconComponent = rankIcons[rank] || Minus;
  const colorClass = rankColors[rank] || "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-xl border overflow-hidden"
      style={{ borderColor: `${faction.color}40` }}
    >
      {/* Color accent bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: faction.color }}
      />
      
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {faction.name}
              {standing && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${colorClass}`}
                  style={{ borderColor: faction.color }}
                >
                  <IconComponent className="h-3 w-3 mr-1" />
                  {rank.charAt(0).toUpperCase() + rank.slice(1)}
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {faction.description}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-bold ${reputation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {reputation >= 0 ? '+' : ''}{reputation}
            </p>
            <p className="text-xs text-muted-foreground">reputation</p>
          </div>
        </div>

        {/* Reputation progress bar */}
        <div className="space-y-1">
          <Progress 
            value={progressPercent} 
            className="h-2"
            style={{ 
              // @ts-ignore - custom CSS property
              '--progress-color': faction.color 
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{rank}</span>
            {currentLevelIndex < sortedLevels.length - 1 && (
              <span>{sortedLevels[currentLevelIndex + 1]?.[0]}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FactionsPanel;
