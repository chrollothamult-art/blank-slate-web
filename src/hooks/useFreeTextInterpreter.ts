import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface StatCheck {
  stat: string;
  difficulty: number;
  player_value?: number;
  result: "pass" | "fail" | "none";
}

export interface PastAction {
  text: string;
  outcome: string;
  stat_check?: string;
}

export interface ActionResult {
  is_valid: boolean;
  interpretation: string;
  rejection_reason?: string;
  stat_check: StatCheck;
  outcome_narration: string;
  stat_effects: Record<string, number>;
  flag_effects: Record<string, boolean>;
  xp_reward: number;
}

export const useFreeTextInterpreter = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);

  const interpretAction = async (
    sessionId: string,
    characterId: string,
    nodeId: string,
    playerText: string,
    actionHistory?: PastAction[]
  ): Promise<ActionResult | null> => {
    setLoading(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-interpret-action", {
        body: {
          sessionId,
          characterId,
          nodeId,
          playerText,
          actionHistory: actionHistory?.slice(-10),
        },
      });

      if (error) {
        console.error("Action interpretation error:", error);
        toast({
          title: "Action interpretation failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      if (data.error) {
        toast({
          title: "Could not interpret action",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      const result: ActionResult = {
        is_valid: data.is_valid !== false,
        interpretation: data.interpretation || "Your action is considered...",
        rejection_reason: data.rejection_reason || undefined,
        stat_check: data.stat_check || { stat: "none", difficulty: 0, result: "none" },
        outcome_narration: data.outcome_narration || "The story continues...",
        stat_effects: data.stat_effects || {},
        flag_effects: data.flag_effects || {},
        xp_reward: data.xp_reward || 0,
      };

      setLastResult(result);

      // If action was rejected, show the rejection reason
      if (!result.is_valid) {
        toast({
          title: "⚠️ Action Not Possible",
          description: result.rejection_reason || result.outcome_narration,
        });
        return result;
      }

      // Show XP toast if earned
      if (result.xp_reward > 0) {
        toast({
          title: `+${result.xp_reward} XP`,
          description: "Experience gained from your action",
        });
      }

      // Show stat change toasts
      for (const [stat, change] of Object.entries(result.stat_effects)) {
        if (change !== 0) {
          toast({
            title: `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${change > 0 ? "+" : ""}${change}`,
          });
        }
      }

      return result;
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    interpretAction,
    loading,
    lastResult,
    clearResult: () => setLastResult(null),
  };
};
