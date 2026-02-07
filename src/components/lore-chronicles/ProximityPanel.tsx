import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, MapPin, Footprints, ArrowUp, ArrowDown, 
  Target, Shield, Sword, Eye, EyeOff, Play, X 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  usePlayerPositions, 
  ProximityZone, 
  ZONE_DISTANCES, 
  MOVEMENT_ACTIONS,
  PlayerPosition,
  PreparedAction 
} from "@/hooks/usePlayerPositions";

interface ProximityPanelProps {
  sessionId: string;
  campaignId: string;
  participants: Array<{
    character_id: string;
    character?: {
      id: string;
      name: string;
      portrait_url: string | null;
      user_id: string;
    };
  }>;
}

const ZoneBadge = ({ zone }: { zone: ProximityZone }) => {
  const colors: Record<ProximityZone, string> = {
    far: "bg-muted text-muted-foreground",
    mid: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    close: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
    adjacent: "bg-red-500/20 text-red-600 dark:text-red-400",
  };

  return (
    <Badge className={`${colors[zone]} border-0`}>
      {ZONE_DISTANCES[zone].label}
    </Badge>
  );
};

export const ProximityPanel = ({ sessionId, campaignId, participants }: ProximityPanelProps) => {
  const {
    positions,
    preparedActions,
    pvpSettings,
    actionLog,
    loading,
    myCharacterId,
    moveToward,
    setZone,
    prepareAction,
    executeAction,
    cancelPreparedAction,
  } = usePlayerPositions(sessionId, campaignId);

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>("");

  // Filter out my character from other participants
  const otherParticipants = participants.filter((p) => p.character_id !== myCharacterId);

  // Get my position relative to a target
  const getMyPositionTo = (targetId: string): ProximityZone => {
    const pos = positions.find(
      (p) => p.character_id === myCharacterId && p.relative_to_character_id === targetId
    );
    return pos?.zone || "far";
  };

  const handlePrepareAction = async () => {
    if (!selectedAction || !selectedTarget) return;
    await prepareAction(selectedAction, selectedTarget);
    setSelectedAction("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading positions...</div>
        </CardContent>
      </Card>
    );
  }

  if (!pvpSettings?.pvp_enabled) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Physical Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Physical interactions are not enabled for this campaign.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Physical Interactions
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {pvpSettings.lethality_mode}
          </Badge>
          {pvpSettings.friendly_fire && (
            <Badge variant="destructive" className="text-xs">
              Friendly Fire
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="positions">
          <TabsList className="w-full">
            <TabsTrigger value="positions" className="flex-1 gap-1">
              <MapPin className="h-3 w-3" />
              Positions
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex-1 gap-1">
              <Sword className="h-3 w-3" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="log" className="flex-1 gap-1">
              <Eye className="h-3 w-3" />
              Log
            </TabsTrigger>
          </TabsList>

          {/* Positions Tab */}
          <TabsContent value="positions" className="mt-4 space-y-3">
            {otherParticipants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No other players in this session
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-3">
                  {otherParticipants.map((p) => {
                    const zone = getMyPositionTo(p.character_id);
                    return (
                      <motion.div
                        key={p.character_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={p.character?.portrait_url || undefined} />
                            <AvatarFallback>
                              {p.character?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {p.character?.name || "Unknown"}
                            </p>
                            <ZoneBadge zone={zone} />
                          </div>
                        </div>

                        {/* Movement Controls */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveToward(p.character_id, "closer")}
                            disabled={zone === "adjacent"}
                            className="flex-1"
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Closer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveToward(p.character_id, "farther")}
                            disabled={zone === "far"}
                            className="flex-1"
                          >
                            <ArrowDown className="h-3 w-3 mr-1" />
                            Farther
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedTarget === p.character_id ? "default" : "ghost"}
                            onClick={() => setSelectedTarget(
                              selectedTarget === p.character_id ? null : p.character_id
                            )}
                          >
                            <Target className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Zone Selector */}
                        {selectedTarget === p.character_id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-3 pt-3 border-t"
                          >
                            <p className="text-xs text-muted-foreground mb-2">
                              Set exact position:
                            </p>
                            <div className="grid grid-cols-4 gap-1">
                              {(["adjacent", "close", "mid", "far"] as ProximityZone[]).map((z) => (
                                <Button
                                  key={z}
                                  size="sm"
                                  variant={zone === z ? "default" : "outline"}
                                  className="text-xs px-2"
                                  onClick={() => setZone(p.character_id, z)}
                                >
                                  {z.charAt(0).toUpperCase() + z.slice(1)}
                                </Button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-4 space-y-4">
            {/* Prepare Action */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Prepare Action</p>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_ACTIONS.map((action) => (
                    <SelectItem key={action.id} value={action.id}>
                      {action.label} — {action.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedTarget || ""} 
                onValueChange={(v) => setSelectedTarget(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  {otherParticipants.map((p) => (
                    <SelectItem key={p.character_id} value={p.character_id}>
                      {p.character?.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handlePrepareAction}
                disabled={!selectedAction || !selectedTarget}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Prepare Action
              </Button>
            </div>

            <Separator />

            {/* Prepared Actions */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Prepared Actions ({preparedActions.length})
              </p>
              
              {preparedActions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No actions prepared</p>
              ) : (
                <div className="space-y-2">
                  {preparedActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-2 rounded border bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">{action.action_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.is_revealed ? "Revealed" : "Hidden"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => executeAction(action.id)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => cancelPreparedAction(action.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Action Log Tab */}
          <TabsContent value="log" className="mt-4">
            <ScrollArea className="h-[300px]">
              {actionLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No actions recorded yet
                </p>
              ) : (
                <div className="space-y-2 pr-3">
                  {actionLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 rounded border text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{entry.action_type}</span>
                        {entry.was_detected && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Detected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.executed_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
