import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Flag, CheckCircle2, Circle, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface KeyPointData {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
  node_id: string | null;
  conditions: Record<string, unknown>;
}

interface KeyPointProgressProps {
  campaignId: string;
  visitedNodeIds: string[];
  storyFlags: Record<string, unknown>;
}

export const KeyPointProgress = ({
  campaignId,
  visitedNodeIds,
  storyFlags,
}: KeyPointProgressProps) => {
  const [keyPoints, setKeyPoints] = useState<KeyPointData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeyPoints = useCallback(async () => {
    if (!campaignId) return;

    const { data } = await supabase
      .from("rp_key_points")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("order_index");

    if (data) {
      setKeyPoints(
        data.map((kp) => ({
          ...kp,
          conditions: (kp.conditions as Record<string, unknown>) || {},
        }))
      );
    }
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    fetchKeyPoints();
  }, [fetchKeyPoints]);

  /**
   * Determine if a key point has been reached.
   * A key point is reached if its linked node has been visited.
   */
  const isReached = (kp: KeyPointData): boolean => {
    if (!kp.node_id) return false;
    return visitedNodeIds.includes(kp.node_id);
  };

  /**
   * Determine if a key point is conditionally locked.
   * It's locked if it has conditions and those conditions aren't met.
   */
  const isLocked = (kp: KeyPointData): boolean => {
    if (Object.keys(kp.conditions).length === 0) return false;
    // Simple flag-based condition check
    for (const [key, value] of Object.entries(kp.conditions)) {
      if (storyFlags[key] !== value) return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (keyPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Flag className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No key points defined for this campaign.
        </p>
      </div>
    );
  }

  const reachedCount = keyPoints.filter(isReached).length;
  const totalCount = keyPoints.length;
  const progressPercent = totalCount > 0 ? Math.round((reachedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium">
          {reachedCount}/{totalCount} milestones
        </p>
        <Badge variant={progressPercent === 100 ? "default" : "secondary"} className="text-xs">
          {progressPercent}%
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <Separator />

      {/* Key points list */}
      <ScrollArea className="h-full">
        <div className="space-y-2 p-1">
          {keyPoints.map((kp, index) => {
            const reached = isReached(kp);
            const locked = isLocked(kp);

            return (
              <motion.div
                key={kp.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`transition-colors ${
                    reached
                      ? "border-primary/40 bg-primary/5"
                      : locked
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2.5">
                      {reached ? (
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : locked ? (
                        <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-medium leading-tight ${
                              reached ? "text-primary" : ""
                            }`}
                          >
                            {kp.title}
                          </p>
                          {kp.is_required && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Required
                            </Badge>
                          )}
                        </div>
                        {kp.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {reached ? kp.description : "???"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Show path arrows between sequential key points */}
                    {index < keyPoints.length - 1 && reached && (
                      <div className="flex justify-center mt-2">
                        <ArrowRight className="h-3 w-3 text-primary/40" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
