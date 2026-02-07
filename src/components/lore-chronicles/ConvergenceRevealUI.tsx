import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Swords, Handshake, HelpCircle, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ConvergencePlayer {
  id: string;
  characterName: string;
  characterPortrait?: string;
  playerName: string;
  faction?: string;
  keyChoices: string[];
  relationship: "ally" | "enemy" | "neutral";
}

interface ConvergenceRevealProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  currentPlayer: ConvergencePlayer;
  otherPlayers: ConvergencePlayer[];
  convergenceTitle: string;
  convergenceDescription: string;
}

const relationshipConfig = {
  ally: {
    icon: Handshake,
    label: "Ally",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    description: "Your paths align. You share common goals.",
  },
  enemy: {
    icon: Swords,
    label: "Enemy",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    description: "Your choices have put you at odds.",
  },
  neutral: {
    icon: HelpCircle,
    label: "Unknown",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    description: "The outcome depends on what happens next.",
  },
};

export const ConvergenceRevealUI = ({
  isOpen,
  onClose,
  onContinue,
  currentPlayer,
  otherPlayers,
  convergenceTitle,
  convergenceDescription,
}: ConvergenceRevealProps) => {
  const [revealStep, setRevealStep] = useState(0);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRevealStep(0);
      const timer = setTimeout(() => setRevealStep(1), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (revealStep > 0 && revealStep <= otherPlayers.length) {
      const timer = setTimeout(() => setRevealStep((s) => s + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [revealStep, otherPlayers.length]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10"
          >
            <X className="h-5 w-5" />
          </Button>

          <Card className="border-primary/30 bg-background/95">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/30">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2">{convergenceTitle}</CardTitle>
                <p className="text-muted-foreground">{convergenceDescription}</p>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Current Player */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center mb-4">
                  <Badge variant="outline" className="mb-2">Your Character</Badge>
                </div>
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={currentPlayer.characterPortrait} />
                        <AvatarFallback className="text-xl">
                          {currentPlayer.characterName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{currentPlayer.characterName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Played by {currentPlayer.playerName}
                        </p>
                        {currentPlayer.faction && (
                          <Badge variant="secondary" className="mt-1">
                            {currentPlayer.faction}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {currentPlayer.keyChoices.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Key Choices Made:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {currentPlayer.keyChoices.map((choice, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <ChevronRight className="h-3 w-3" />
                              {choice}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <Separator className="my-6" />

              {/* Other Players Reveal */}
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Badge variant="outline" className="mb-2">Paths Converge With</Badge>
                </div>

                {otherPlayers.map((player, index) => {
                  const config = relationshipConfig[player.relationship];
                  const RelationIcon = config.icon;
                  const isRevealed = revealStep > index;

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: 50, opacity: 0, scale: 0.9 }}
                      animate={
                        isRevealed
                          ? { x: 0, opacity: 1, scale: 1 }
                          : { x: 50, opacity: 0.3, scale: 0.9 }
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <Card
                        className={`transition-all cursor-pointer hover:shadow-lg ${
                          isRevealed ? `${config.bg} ${config.border} border-2` : "opacity-50"
                        }`}
                        onClick={() => isRevealed && setShowDetails(showDetails === player.id ? null : player.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            {isRevealed ? (
                              <Avatar className="h-16 w-16 border-2">
                                <AvatarImage src={player.characterPortrait} />
                                <AvatarFallback className="text-xl">
                                  {player.characterName[0]}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <HelpCircle className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}

                            <div className="flex-1">
                              {isRevealed ? (
                                <>
                                  <h3 className="text-xl font-bold">{player.characterName}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Played by {player.playerName}
                                  </p>
                                  {player.faction && (
                                    <Badge variant="secondary" className="mt-1">
                                      {player.faction}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                </div>
                              )}
                            </div>

                            {isRevealed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg ${config.bg}`}
                              >
                                <RelationIcon className={`h-8 w-8 ${config.color}`} />
                                <span className={`text-sm font-bold ${config.color}`}>
                                  {config.label}
                                </span>
                              </motion.div>
                            )}
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isRevealed && showDetails === player.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t space-y-3">
                                  <p className={`text-sm font-medium ${config.color}`}>
                                    {config.description}
                                  </p>
                                  {player.keyChoices.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Their Key Choices:</p>
                                      <ul className="text-sm text-muted-foreground space-y-1">
                                        {player.keyChoices.map((choice, i) => (
                                          <li key={i} className="flex items-center gap-2">
                                            <ChevronRight className="h-3 w-3" />
                                            {choice}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: revealStep > otherPlayers.length ? 1 : 0.3 }}
                className="pt-6"
              >
                <Button
                  size="lg"
                  className="w-full"
                  disabled={revealStep <= otherPlayers.length}
                  onClick={onContinue}
                >
                  Continue Your Journey
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
