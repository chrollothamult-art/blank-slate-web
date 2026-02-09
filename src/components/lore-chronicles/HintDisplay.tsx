import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Compass, Swords, MessageCircle, Search, AlertTriangle, Check, X, Shuffle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hint, HintType, HintResponse } from "@/hooks/useHints";

interface HintDisplayProps {
  hints: Hint[];
  onRespond: (hintId: string, response: HintResponse) => void;
  disabled?: boolean;
}

const HINT_ICONS: Record<HintType, React.ReactNode> = {
  direction: <Compass className="h-4 w-4" />,
  action: <Swords className="h-4 w-4" />,
  social: <MessageCircle className="h-4 w-4" />,
  discovery: <Search className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
};

const FLAVOR_LABELS: Record<string, string> = {
  inner_voice: "A voice within whispers:",
  companion_whisper: "Your companion leans close:",
  environmental_clue: "You notice something:",
  divine_sign: "A sign from above:",
};

export const HintDisplay = ({ hints, onRespond, disabled }: HintDisplayProps) => {
  const [respondedHints, setRespondedHints] = useState<Set<string>>(new Set());

  if (hints.length === 0) return null;

  const handleRespond = (hintId: string, response: HintResponse) => {
    setRespondedHints((prev) => new Set(prev).add(hintId));
    onRespond(hintId, response);
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {hints.map((hint, index) => {
          const alreadyResponded = respondedHints.has(hint.id);

          return (
            <motion.div
              key={hint.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    <span>{FLAVOR_LABELS[hint.source_flavor] || "A hint appears:"}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {HINT_ICONS[hint.hint_type]}
                    </Badge>
                  </div>

                  <p className="text-sm italic leading-relaxed">
                    "{hint.hint_text}"
                  </p>

                  {!alreadyResponded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2"
                    >
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRespond(hint.id, "followed")}
                        disabled={disabled}
                        className="gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Follow
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRespond(hint.id, "ignored")}
                        disabled={disabled}
                        className="gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Ignore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(hint.id, "opposite")}
                        disabled={disabled}
                        className="gap-1.5"
                      >
                        <Shuffle className="h-3.5 w-3.5" />
                        Defy
                      </Button>
                    </motion.div>
                  )}

                  {alreadyResponded && (
                    <p className="text-xs text-muted-foreground">You've made your choice...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
