import { motion, AnimatePresence } from "framer-motion";
import { Dices, Sparkles, TrendingUp, Flag, CheckCircle, XCircle, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionResult } from "@/hooks/useFreeTextInterpreter";

interface ActionOutcomeDisplayProps {
  result: ActionResult | null;
  onDismiss?: () => void;
}

export const ActionOutcomeDisplay = ({ result, onDismiss }: ActionOutcomeDisplayProps) => {
  if (!result) return null;

  const getStatCheckIcon = () => {
    switch (result.stat_check.result) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatCheckColor = () => {
    switch (result.stat_check.result) {
      case "pass":
        return "border-green-500/30 bg-green-500/10";
      case "fail":
        return "border-red-500/30 bg-red-500/10";
      default:
        return "border-muted";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="pt-6 space-y-4">
            {/* Interpretation */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground italic">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{result.interpretation}</span>
            </div>

            {/* Stat Check Visualization */}
            {result.stat_check.stat !== "none" && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`rounded-lg border p-4 ${getStatCheckColor()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dices className="h-5 w-5 text-primary" />
                    <span className="font-medium capitalize">{result.stat_check.stat} Check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {result.stat_check.player_value || "?"} vs {result.stat_check.difficulty}
                    </span>
                    {getStatCheckIcon()}
                    <Badge variant={result.stat_check.result === "pass" ? "default" : "destructive"}>
                      {result.stat_check.result === "pass" ? "Success!" : "Failed"}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Outcome Narration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="prose prose-sm dark:prose-invert max-w-none"
            >
              <p className="text-foreground leading-relaxed">{result.outcome_narration}</p>
            </motion.div>

            {/* Effects Summary */}
            <div className="flex flex-wrap gap-2">
              {/* Stat Changes */}
              {Object.entries(result.stat_effects || {}).map(([stat, change]) => (
                <motion.div
                  key={stat}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Badge variant={change > 0 ? "default" : "destructive"} className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat}: {change > 0 ? `+${change}` : change}
                  </Badge>
                </motion.div>
              ))}

              {/* Flag Changes */}
              {Object.entries(result.flag_effects || {}).map(([flag, value]) => (
                <motion.div
                  key={flag}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Badge variant="outline" className="gap-1">
                    <Flag className="h-3 w-3" />
                    {flag}: {value ? "✓" : "✗"}
                  </Badge>
                </motion.div>
              ))}

              {/* XP Reward */}
              {result.xp_reward > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Badge className="gap-1 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    <Sparkles className="h-3 w-3" />
                    +{result.xp_reward} XP
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <div className="flex justify-end pt-2">
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
