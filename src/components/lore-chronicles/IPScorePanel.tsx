import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, TrendingUp, TrendingDown, Heart, Swords, Shield,
  HandHeart, Skull, Eye, History, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useIPScores,
  CharacterIPScore,
  IPChangeHistory,
  RELATIONSHIP_LEVEL_CONFIG,
  RelationshipLevel,
  IP_CHANGE_VALUES,
} from "@/hooks/useIPScores";

interface IPScorePanelProps {
  sessionId: string;
  currentCharacterId: string;
}

export const IPScorePanel = ({ sessionId, currentCharacterId }: IPScorePanelProps) => {
  const { scores, history, loading, adjustIP, getCharacterRelationships } = useIPScores(sessionId);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const myRelationships = getCharacterRelationships(currentCharacterId);

  const getOtherCharacter = (score: CharacterIPScore) => {
    if (score.character_a_id === currentCharacterId) {
      return score.character_b;
    }
    return score.character_a;
  };

  const getRelationshipIcon = (level: RelationshipLevel) => {
    switch (level) {
      case "blood_feud": return <Skull className="h-4 w-4 text-red-700" />;
      case "hostile": return <Swords className="h-4 w-4 text-red-500" />;
      case "distrustful": return <Eye className="h-4 w-4 text-orange-500" />;
      case "neutral": return <Users className="h-4 w-4 text-gray-500" />;
      case "friendly": return <HandHeart className="h-4 w-4 text-green-500" />;
      case "bonded": return <Heart className="h-4 w-4 text-blue-500" />;
      case "sworn": return <Shield className="h-4 w-4 text-purple-500" />;
    }
  };

  const scoreToPercent = (score: number) => ((score + 100) / 200) * 100;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-muted-foreground">Loading relationships...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Interaction Points
        </CardTitle>
        <CardDescription>
          Your relationships with other characters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="relationships">
          <TabsList className="w-full">
            <TabsTrigger value="relationships" className="flex-1 gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <History className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="relationships" className="mt-4">
            {myRelationships.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No interactions yet</p>
                <p className="text-xs mt-1">Interact with other characters to build relationships</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {myRelationships.map((rel) => {
                    const other = getOtherCharacter(rel);
                    const levelConfig = RELATIONSHIP_LEVEL_CONFIG[rel.relationship_level];
                    
                    return (
                      <motion.div
                        key={rel.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {other?.portrait_url ? (
                              <img src={other.portrait_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{other?.name || "Unknown"}</span>
                              <Badge className={`text-xs ${levelConfig.color}`}>
                                {getRelationshipIcon(rel.relationship_level)}
                                <span className="ml-1">{levelConfig.label}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Progress 
                                value={scoreToPercent(rel.score)} 
                                className="h-2 flex-1"
                              />
                              <span className={`text-xs font-mono w-10 text-right ${
                                rel.score > 0 ? "text-green-500" : rel.score < 0 ? "text-red-500" : "text-muted-foreground"
                              }`}>
                                {rel.score > 0 ? "+" : ""}{rel.score}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{levelConfig.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No history yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {history.slice(0, expandedHistory ? undefined : 10).map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      {entry.change_amount > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{entry.reason}</span>
                      <span className={`font-mono text-xs ${
                        entry.change_amount > 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {entry.change_amount > 0 ? "+" : ""}{entry.change_amount}
                      </span>
                    </motion.div>
                  ))}
                  {history.length > 10 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setExpandedHistory(!expandedHistory)}
                    >
                      {expandedHistory ? (
                        <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></>
                      ) : (
                        <>Show All ({history.length}) <ChevronDown className="h-3 w-3 ml-1" /></>
                      )}
                    </Button>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Quick action buttons for common IP changes
interface QuickIPActionsProps {
  sessionId: string;
  actorId: string;
  targetId: string;
  targetName: string;
  onComplete?: () => void;
}

export const QuickIPActions = ({ 
  sessionId, 
  actorId, 
  targetId, 
  targetName,
  onComplete 
}: QuickIPActionsProps) => {
  const { adjustIP } = useIPScores(sessionId);
  const [acting, setActing] = useState(false);

  const handleAction = async (reason: string, value: number) => {
    setActing(true);
    await adjustIP(actorId, targetId, value, reason);
    setActing(false);
    onComplete?.();
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={acting}
        onClick={() => handleAction(`Helped ${targetName}`, IP_CHANGE_VALUES.helped_in_combat)}
        className="text-xs"
      >
        <HandHeart className="h-3 w-3 mr-1 text-green-500" />
        Help (+15)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={acting}
        onClick={() => handleAction(`Shared item with ${targetName}`, IP_CHANGE_VALUES.shared_item)}
        className="text-xs"
      >
        <Heart className="h-3 w-3 mr-1 text-blue-500" />
        Share (+10)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={acting}
        onClick={() => handleAction(`Insulted ${targetName}`, IP_CHANGE_VALUES.insult)}
        className="text-xs"
      >
        <TrendingDown className="h-3 w-3 mr-1 text-orange-500" />
        Insult (-5)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={acting}
        onClick={() => handleAction(`Attacked ${targetName}`, IP_CHANGE_VALUES.attacked)}
        className="text-xs"
      >
        <Swords className="h-3 w-3 mr-1 text-red-500" />
        Attack (-30)
      </Button>
    </div>
  );
};
