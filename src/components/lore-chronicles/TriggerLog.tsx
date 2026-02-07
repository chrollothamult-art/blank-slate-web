import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles, Shield, Package, Flag, MessageSquare, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiredTrigger } from "@/hooks/useSessionTriggers";
import { EventType } from "@/hooks/useEventTriggers";

interface TriggerLogProps {
  entries: FiredTrigger[];
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  unlock_path: <Sparkles className="h-3.5 w-3.5" />,
  spawn_node: <Sparkles className="h-3.5 w-3.5" />,
  modify_stat: <Shield className="h-3.5 w-3.5" />,
  grant_item: <Package className="h-3.5 w-3.5" />,
  set_flag: <Flag className="h-3.5 w-3.5" />,
  show_message: <MessageSquare className="h-3.5 w-3.5" />,
  award_xp: <Award className="h-3.5 w-3.5" />,
};

const EVENT_COLORS: Record<EventType, string> = {
  unlock_path: "text-purple-500",
  spawn_node: "text-blue-500",
  modify_stat: "text-amber-500",
  grant_item: "text-emerald-500",
  set_flag: "text-cyan-500",
  show_message: "text-primary",
  award_xp: "text-yellow-500",
};

export const TriggerLog = ({ entries }: TriggerLogProps) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Zap className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No triggers fired yet. Keep playing to activate events!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        <AnimatePresence>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="border-muted">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 ${EVENT_COLORS[entry.event_type] || "text-primary"}`}>
                      {EVENT_ICONS[entry.event_type] || <Zap className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{entry.event_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.trigger_name}</p>
                      {entry.event_type === "show_message" && entry.payload.message && (
                        <p className="text-xs italic mt-1 text-muted-foreground">
                          "{String(entry.payload.message)}"
                        </p>
                      )}
                      {entry.event_type === "modify_stat" && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {String(entry.payload.stat)}: {String(entry.payload.change)}
                        </Badge>
                      )}
                      {entry.event_type === "grant_item" && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          +{String(entry.payload.item_name)}
                        </Badge>
                      )}
                      {entry.event_type === "award_xp" && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          +{String(entry.payload.amount)} XP
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};
