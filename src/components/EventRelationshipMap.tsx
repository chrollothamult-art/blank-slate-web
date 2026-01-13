import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Share2, Zap, Link2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventRelationship {
  id: string;
  source_event_id: string;
  target_event_id: string;
  relationship_type: "causes" | "caused_by" | "related_to" | "precedes" | "follows";
  description?: string;
  source_event?: {
    title: string;
    date: string;
  };
  target_event?: {
    title: string;
    date: string;
  };
}

interface EventNode {
  id: string;
  title: string;
  date: string;
}

const relationshipConfig = {
  causes: {
    label: "Causes",
    icon: Zap,
    color: "from-red-500/20 to-orange-500/20 border-red-500/50",
    textColor: "text-red-600",
    description: "Led to this event"
  },
  caused_by: {
    label: "Caused By",
    icon: Zap,
    color: "from-orange-500/20 to-red-500/20 border-orange-500/50",
    textColor: "text-orange-600",
    description: "Result of this event"
  },
  precedes: {
    label: "Precedes",
    icon: Clock,
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/50",
    textColor: "text-blue-600",
    description: "Happened before"
  },
  follows: {
    label: "Follows",
    icon: Clock,
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/50",
    textColor: "text-cyan-600",
    description: "Happened after"
  },
  related_to: {
    label: "Related To",
    icon: Link2,
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/50",
    textColor: "text-purple-600",
    description: "Connected event"
  }
};

interface EventRelationshipMapProps {
  eventId: string;
  eventTitle: string;
}

export const EventRelationshipMap = ({
  eventId,
  eventTitle
}: EventRelationshipMapProps) => {
  const [relationships, setRelationships] = useState<EventRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelationships();
  }, [eventId]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);

      const { data: outgoing } = await supabase
        .from("chronology_event_relationships")
        .select(`
          id,
          source_event_id,
          target_event_id,
          relationship_type,
          description,
          source_event:source_event_id(title, date),
          target_event:target_event_id(title, date)
        `)
        .eq("source_event_id", eventId);

      const { data: incoming } = await supabase
        .from("chronology_event_relationships")
        .select(`
          id,
          source_event_id,
          target_event_id,
          relationship_type,
          description,
          source_event:source_event_id(title, date),
          target_event:target_event_id(title, date)
        `)
        .eq("target_event_id", eventId);

      const allRelationships = [...(outgoing || []), ...(incoming || [])];
      setRelationships(allRelationships);
    } catch (error) {
      console.error("Failed to fetch relationships:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedRelationships = useMemo(() => {
    const grouped: Record<string, EventRelationship[]> = {
      causes: [],
      caused_by: [],
      precedes: [],
      follows: [],
      related_to: []
    };

    relationships.forEach((rel) => {
      grouped[rel.relationship_type].push(rel);
    });

    return grouped;
  }, [relationships]);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center text-slate-500">Loading connections...</div>
      </Card>
    );
  }

  const hasRelationships = relationships.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-blue-600" />
          Event Connections
        </h3>
        <p className="text-slate-600">
          Discover how this event connects to others in the timeline
        </p>
      </div>

      {!hasRelationships ? (
        <Card className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 text-center">
          <p className="text-slate-500">No connections recorded for this event</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(relationshipConfig).map(([type, config]) => {
            const rels = groupedRelationships[type as keyof typeof relationshipConfig];
            if (rels.length === 0) return null;

            const Icon = config.icon;

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${config.textColor}`} />
                  <h4 className={`font-semibold ${config.textColor}`}>
                    {config.label}
                  </h4>
                  <Badge variant="secondary" className="ml-auto">
                    {rels.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {rels.map((rel) => {
                    const isOutgoing = rel.source_event_id === eventId;
                    const connectedEvent = isOutgoing ? rel.target_event : rel.source_event;

                    if (!connectedEvent) return null;

                    return (
                      <Card
                        key={rel.id}
                        className={cn(
                          "p-4 border-2 transition-all hover:shadow-lg",
                          config.color
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {connectedEvent.title}
                              </p>
                              <p className="text-sm text-slate-600">
                                {connectedEvent.date}
                              </p>
                            </div>
                            <ArrowRight className={`w-5 h-5 ${config.textColor} flex-shrink-0`} />
                          </div>

                          {rel.description && (
                            <p className="text-sm text-slate-700 italic pl-4 border-l-2 border-slate-300">
                              {rel.description}
                            </p>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
