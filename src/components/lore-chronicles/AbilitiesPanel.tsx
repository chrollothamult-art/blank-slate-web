import { motion } from "framer-motion";
import { Zap, Lock, Sparkles, Shield, Swords, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProgression, RpCharacterAbility, RpAbility } from "@/hooks/useProgression";

interface AbilitiesPanelProps {
  characterId: string;
  abilitySlots: number;
}

const rarityColors: Record<string, string> = {
  common: "bg-slate-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-amber-500",
};

const rarityBorderColors: Record<string, string> = {
  common: "border-slate-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/30 shadow-amber-500/20 shadow-lg",
};

const abilityTypeIcons: Record<string, typeof Zap> = {
  passive: Shield,
  active: Swords,
  stat_boost: Brain,
};

export const AbilitiesPanel = ({ characterId, abilitySlots }: AbilitiesPanelProps) => {
  const { characterAbilities, abilities, loading } = useProgression(characterId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading abilities...</div>
        </CardContent>
      </Card>
    );
  }

  const unlockedCount = characterAbilities.length;
  const emptySlots = Math.max(0, abilitySlots - unlockedCount);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Abilities
          </CardTitle>
          <Badge variant="outline">
            {unlockedCount} / {abilitySlots} slots
          </Badge>
        </div>
        <CardDescription>
          Powers and skills unlocked through your adventures
        </CardDescription>
      </CardHeader>
      <CardContent>
        {characterAbilities.length === 0 && emptySlots === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No abilities yet</p>
            <p className="text-sm">Complete story nodes to unlock abilities</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {characterAbilities.map((charAbility, index) => (
              <AbilityCard 
                key={charAbility.id} 
                characterAbility={charAbility}
                abilities={abilities}
                index={index}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (characterAbilities.length + i) * 0.05 }}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/10"
              >
                <Lock className="h-6 w-6 text-muted-foreground/30" />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AbilityCard = ({ 
  characterAbility, 
  abilities,
  index 
}: { 
  characterAbility: RpCharacterAbility;
  abilities: RpAbility[];
  index: number;
}) => {
  // Try to match with an ability from the abilities table
  const matchedAbility = abilities.find(a => a.name === characterAbility.ability_name);
  const rarity = matchedAbility?.rarity || "common";
  const abilityType = matchedAbility?.ability_type || "passive";
  const icon = matchedAbility?.icon || "⚔️";
  const statBonus = matchedAbility?.stat_bonus;
  
  const IconComponent = abilityTypeIcons[abilityType] || Zap;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className={`aspect-square rounded-xl border-2 ${rarityBorderColors[rarity]} bg-gradient-to-br from-background to-muted/30 p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group`}
          >
            {/* Rarity glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity ${rarityColors[rarity]}`} />
            
            {/* Icon */}
            <span className="text-3xl mb-1">{icon}</span>
            
            {/* Name */}
            <p className="text-xs font-semibold line-clamp-2 leading-tight">
              {characterAbility.ability_name}
            </p>
            
            {/* Type indicator */}
            <div className="absolute top-1 right-1">
              <IconComponent className="h-3 w-3 text-muted-foreground" />
            </div>
            
            {/* Rarity dot */}
            <div className={`absolute bottom-1 left-1 h-2 w-2 rounded-full ${rarityColors[rarity]}`} />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <span className="font-semibold">{characterAbility.ability_name}</span>
              <Badge className={`${rarityColors[rarity]} text-white text-xs`}>
                {rarity}
              </Badge>
            </div>
            {characterAbility.description && (
              <p className="text-sm text-muted-foreground">
                {characterAbility.description}
              </p>
            )}
            {matchedAbility?.description && (
              <p className="text-sm text-muted-foreground">
                {matchedAbility.description}
              </p>
            )}
            {statBonus && Object.keys(statBonus).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(statBonus).map(([stat, value]) => (
                  <Badge key={stat} variant="secondary" className="text-xs">
                    {stat} +{value}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Unlocked: {new Date(characterAbility.unlocked_at).toLocaleDateString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AbilitiesPanel;
