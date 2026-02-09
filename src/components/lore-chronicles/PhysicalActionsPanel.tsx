import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword, Shield, Eye, Zap, MessageSquare,
  Target, ChevronDown, ChevronUp, Lock, Check, X,
  Crosshair, Wind, Footprints
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  usePhysicalActions,
  PhysicalAction,
  ActionCategory,
  BUILTIN_ACTIONS,
} from "@/hooks/usePhysicalActions";
import type { PlayerPosition, PvPSettings } from "@/hooks/usePlayerPositions";

interface PhysicalActionsPanelProps {
  sessionId: string;
  campaignId: string;
  myCharacterId: string | null;
  positions: PlayerPosition[];
  pvpSettings: PvPSettings | null;
  participants: Array<{
    character_id: string;
    character?: {
      id: string;
      name: string;
      portrait_url: string | null;
      user_id: string;
    };
  }>;
  preparedActions: Array<{ id: string; action_type: string; target_character_id: string | null; is_revealed: boolean }>;
  onExecutePrepared: (preparedActionId: string) => void;
}

const CATEGORY_ICONS: Record<ActionCategory, typeof Sword> = {
  melee: Sword,
  stealth: Eye,
  social: MessageSquare,
  ranged: Crosshair,
  movement: Footprints,
};

const CATEGORY_COLORS: Record<ActionCategory, string> = {
  melee: "text-red-500",
  stealth: "text-purple-500",
  social: "text-blue-500",
  ranged: "text-green-500",
  movement: "text-yellow-500",
};

export const PhysicalActionsPanel = ({
  sessionId,
  campaignId,
  myCharacterId,
  positions,
  pvpSettings,
  participants,
  preparedActions,
  onExecutePrepared,
}: PhysicalActionsPanelProps) => {
  const {
    allActions,
    inventory,
    characterStats,
    preparationSlots,
    checkActionAvailability,
    executePhysicalAction,
  } = usePhysicalActions(sessionId, campaignId, myCharacterId, positions, pvpSettings);

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ActionCategory>("melee");
  const [executing, setExecuting] = useState(false);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const otherParticipants = participants.filter((p) => p.character_id !== myCharacterId);

  // Actions filtered by category
  const filteredActions = useMemo(
    () => allActions.filter((a) => a.category === activeCategory),
    [allActions, activeCategory]
  );

  // Available actions for selected target
  const targetActions = useMemo(() => {
    if (!selectedTarget) return [];
    return filteredActions.map((action) => ({
      action,
      availability: checkActionAvailability(action, selectedTarget),
    }));
  }, [filteredActions, selectedTarget, checkActionAvailability]);

  const handleExecuteAction = async (action: PhysicalAction) => {
    if (!selectedTarget) return;
    setExecuting(true);

    // Check if this action was prepared
    const prepared = preparedActions.find(
      (p) => p.action_type === action.id && p.target_character_id === selectedTarget
    );

    await executePhysicalAction(action, selectedTarget, !!prepared, prepared?.id);
    if (prepared) {
      onExecutePrepared(prepared.id);
    }

    setExecuting(false);
  };

  const targetName = (id: string) =>
    otherParticipants.find((p) => p.character_id === id)?.character?.name || "Unknown";

  return (
    <div className="space-y-4">
      {/* Target selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Select Target
        </p>
        <div className="flex flex-wrap gap-2">
          {otherParticipants.map((p) => (
            <Button
              key={p.character_id}
              size="sm"
              variant={selectedTarget === p.character_id ? "default" : "outline"}
              onClick={() => setSelectedTarget(
                selectedTarget === p.character_id ? null : p.character_id
              )}
            >
              {p.character?.name || "Unknown"}
            </Button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ActionCategory)}>
        <TabsList className="w-full grid grid-cols-5">
          {(Object.keys(CATEGORY_ICONS) as ActionCategory[]).map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <TabsTrigger key={cat} value={cat} className="text-xs gap-1 px-1">
                <Icon className={`h-3 w-3 ${CATEGORY_COLORS[cat]}`} />
                <span className="hidden sm:inline capitalize">{cat}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-3">
          {!selectedTarget ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Select a target to see available actions
            </p>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-2">
                <AnimatePresence>
                  {targetActions.map(({ action, availability }) => {
                    const isPrepared = preparedActions.some(
                      (p) => p.action_type === action.id && p.target_character_id === selectedTarget
                    );
                    const isExpanded = expandedAction === action.id;

                    return (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border p-3 transition-colors ${
                          availability.available
                            ? "bg-card hover:bg-muted/50 cursor-pointer"
                            : "bg-muted/30 opacity-60"
                        }`}
                        onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {!availability.available && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                            <span className="font-medium text-sm truncate">{action.name}</span>
                            {isPrepared && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Prepared
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {action.requiredStat && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant={availability.statMet ? "outline" : "destructive"}
                                      className="text-[10px] px-1.5"
                                    >
                                      {action.requiredStat.slice(0, 3).toUpperCase()} {action.requiredStatValue}+
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Requires {action.requiredStat} ≥ {action.requiredStatValue}
                                    {availability.statMet ? " ✓" : " ✗"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-[10px]">
                                    Range: {action.requiredRange}
                                  </Badge>
                                  {action.requiredItem && (
                                    <Badge
                                      variant={availability.itemMet ? "outline" : "destructive"}
                                      className="text-[10px]"
                                    >
                                      Item: {action.requiredItem.replace("_", " ")}
                                    </Badge>
                                  )}
                                  {action.isDetectable && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Detect: {action.detectionDifficulty}
                                    </Badge>
                                  )}
                                  {action.cooldownTurns > 0 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      CD: {action.cooldownTurns}
                                    </Badge>
                                  )}
                                </div>

                                {!availability.available && availability.reason && (
                                  <p className="text-xs text-destructive flex items-center gap-1">
                                    <X className="h-3 w-3" /> {availability.reason}
                                  </p>
                                )}

                                {availability.available && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-1"
                                    disabled={executing}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExecuteAction(action);
                                    }}
                                  >
                                    <Zap className="h-3 w-3 mr-1" />
                                    {executing ? "Executing..." : `Execute on ${targetName(selectedTarget)}`}
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Character stats summary */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {Object.entries(characterStats).map(([stat, value]) => (
          <Badge key={stat} variant="outline" className="text-[10px]">
            {stat.slice(0, 3).toUpperCase()}: {value}
          </Badge>
        ))}
        <Badge variant="secondary" className="text-[10px]">
          <Shield className="h-2.5 w-2.5 mr-0.5" />
          Slots: {preparedActions.length}/{preparationSlots}
        </Badge>
      </div>
    </div>
  );
};
