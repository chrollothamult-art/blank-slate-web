import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, MessageSquare, ChevronDown, ChevronUp, CheckCircle, XCircle, Dices } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActionLogEntry {
  id: string;
  action_type: string;
  action_category: string | null;
  outcome: {
    interpretation?: string;
    outcome_narration?: string;
    xp_reward?: number;
  } | null;
  stat_check_result: {
    stat?: string;
    difficulty?: number;
    result?: "pass" | "fail";
    roll?: number;
  } | null;
  executed_at: string;
}

interface ActionHistoryPanelProps {
  sessionId: string | null;
  characterId: string | null;
}

export const ActionHistoryPanel = ({ sessionId, characterId }: ActionHistoryPanelProps) => {
  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!sessionId || !characterId) {
      setLoading(false);
      return;
    }

    const fetchActions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("rp_action_log")
        .select("id, action_type, action_category, outcome, stat_check_result, executed_at")
        .eq("session_id", sessionId)
        .eq("actor_id", characterId)
        .order("executed_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setActions(
          data.map((d) => ({
            id: d.id,
            action_type: d.action_type,
            action_category: d.action_category,
            outcome: d.outcome as ActionLogEntry["outcome"],
            stat_check_result: d.stat_check_result as ActionLogEntry["stat_check_result"],
            executed_at: d.executed_at,
          }))
        );
      }
      setLoading(false);
    };

    fetchActions();

    // Subscribe to new actions
    const channel = supabase
      .channel(`action-history-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rp_action_log",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newAction = payload.new as any;
          if (newAction.actor_id === characterId) {
            setActions((prev) => [
              {
                id: newAction.id,
                action_type: newAction.action_type,
                action_category: newAction.action_category,
                outcome: newAction.outcome,
                stat_check_result: newAction.stat_check_result,
                executed_at: newAction.executed_at,
              },
              ...prev,
            ].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, characterId]);

  if (!sessionId || !characterId) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-muted">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Action History</CardTitle>
                {actions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {actions.length}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading history...
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No actions yet
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {actions.map((action, index) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                          {/* Action header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {action.action_category === "free_text" && (
                                <Badge variant="outline" className="text-xs">
                                  Free Action
                                </Badge>
                              )}
                              {action.stat_check_result && (
                                <div className="flex items-center gap-1">
                                  <Dices className="h-3 w-3" />
                                  <span className="text-xs capitalize">
                                    {action.stat_check_result.stat}
                                  </span>
                                  {action.stat_check_result.result === "pass" ? (
                                    <CheckCircle className="h-3 w-3 text-primary" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-destructive" />
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(action.executed_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          {/* Interpretation */}
                          {action.outcome?.interpretation && (
                            <p className="text-sm italic text-muted-foreground">
                              "{action.outcome.interpretation}"
                            </p>
                          )}

                          {/* Outcome narration */}
                          {action.outcome?.outcome_narration && (
                            <p className="text-sm">{action.outcome.outcome_narration}</p>
                          )}

                          {/* XP reward */}
                          {action.outcome?.xp_reward && action.outcome.xp_reward > 0 && (
                            <div className="text-xs text-primary font-medium">
                              +{action.outcome.xp_reward} XP
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
