import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Bell, BellOff, Shield, AlertTriangle,
  Check, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  usePhysicalActions,
  AwarenessLevel,
  PerceptionEvent,
} from "@/hooks/usePhysicalActions";
import type { PlayerPosition, PvPSettings } from "@/hooks/usePlayerPositions";

interface PerceptionPanelProps {
  sessionId: string;
  campaignId: string;
  myCharacterId: string | null;
  positions: PlayerPosition[];
  pvpSettings: PvPSettings | null;
}

const AWARENESS_ICONS: Record<AwarenessLevel, typeof Eye> = {
  oblivious: EyeOff,
  alert: Bell,
  vigilant: Eye,
  hawkeye: Shield,
};

const AWARENESS_COLORS: Record<AwarenessLevel, string> = {
  oblivious: "text-muted-foreground",
  alert: "text-yellow-500",
  vigilant: "text-orange-500",
  hawkeye: "text-red-500",
};

const AWARENESS_BG: Record<AwarenessLevel, string> = {
  oblivious: "bg-muted/50",
  alert: "bg-yellow-500/10 border-yellow-500/20",
  vigilant: "bg-orange-500/10 border-orange-500/20",
  hawkeye: "bg-red-500/10 border-red-500/20",
};

const AWARENESS_LABELS: Record<AwarenessLevel, string> = {
  oblivious: "Oblivious",
  alert: "Alert",
  vigilant: "Vigilant",
  hawkeye: "Hawkeye",
};

export const PerceptionPanel = ({
  sessionId,
  campaignId,
  myCharacterId,
  positions,
  pvpSettings,
}: PerceptionPanelProps) => {
  const {
    characterStats,
    characterLevel,
    perceptionEvents,
    unreadPerceptionCount,
    calculatePassivePerception,
    markPerceptionRead,
  } = usePhysicalActions(sessionId, campaignId, myCharacterId, positions, pvpSettings);

  const [showAll, setShowAll] = useState(false);

  const passivePerception = calculatePassivePerception();

  // Determine current awareness level from passive perception
  const getMyAwarenessLevel = (): AwarenessLevel => {
    if (passivePerception >= 10) return "hawkeye";
    if (passivePerception >= 7) return "vigilant";
    if (passivePerception >= 4) return "alert";
    return "oblivious";
  };

  const myAwareness = getMyAwarenessLevel();
  const AwarenessIcon = AWARENESS_ICONS[myAwareness];

  const displayedEvents = showAll ? perceptionEvents : perceptionEvents.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Awareness Status */}
      <div className={`rounded-lg border p-3 ${AWARENESS_BG[myAwareness]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AwarenessIcon className={`h-5 w-5 ${AWARENESS_COLORS[myAwareness]}`} />
            <div>
              <p className="font-medium text-sm">{AWARENESS_LABELS[myAwareness]}</p>
              <p className="text-xs text-muted-foreground">
                Passive Perception: {passivePerception}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            WIS {characterStats.wisdom || 3} + AGI {Math.floor((characterStats.agility || 3) / 2)} + LVL {Math.floor(characterLevel / 2)}
          </Badge>
        </div>
      </div>

      {/* Perception breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {(["oblivious", "alert", "vigilant", "hawkeye"] as AwarenessLevel[]).map((level) => {
          const Icon = AWARENESS_ICONS[level];
          const isActive = level === myAwareness;
          return (
            <div
              key={level}
              className={`rounded-lg border p-2 text-center ${
                isActive ? AWARENESS_BG[level] : "bg-muted/20 opacity-50"
              }`}
            >
              <Icon className={`h-4 w-4 mx-auto mb-1 ${AWARENESS_COLORS[level]}`} />
              <p className="text-[10px] font-medium capitalize">{level}</p>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Detection Alerts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Detection Alerts
            {unreadPerceptionCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {unreadPerceptionCount}
              </Badge>
            )}
          </p>
          {unreadPerceptionCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={markPerceptionRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[200px]">
          {perceptionEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No detection alerts yet. Stay vigilant.
            </p>
          ) : (
            <div className="space-y-2 pr-2">
              <AnimatePresence>
                {displayedEvents.map((event) => {
                  const Icon = AWARENESS_ICONS[event.detection_level];
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-lg border p-2.5 ${
                        !event.is_read ? AWARENESS_BG[event.detection_level] : "bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon
                          className={`h-4 w-4 mt-0.5 shrink-0 ${AWARENESS_COLORS[event.detection_level]}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${AWARENESS_COLORS[event.detection_level]}`}
                            >
                              {AWARENESS_LABELS[event.detection_level]}
                            </Badge>
                            {!event.is_read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm">{event.message || "Something happened nearby…"}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {perceptionEvents.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" /> Show all ({perceptionEvents.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
