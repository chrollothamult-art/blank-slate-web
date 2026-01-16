import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChronologyEvent {
  id: string;
  title: string;
  date: string;
  era?: string;
}

interface EventLink {
  id: string;
  character_id: string;
  event_id: string;
  role?: string;
  description?: string;
  character_name?: string;
}

interface NodePosition {
  x: number;
  y: number;
}

const eraColors: Record<string, string> = {
  BGD: "hsl(262, 83%, 58%)",
  GD: "hsl(45, 93%, 47%)",
  AGD: "hsl(173, 80%, 40%)",
  default: "hsl(var(--muted-foreground))",
};

export const AllEventsRelationshipMap = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ChronologyEvent[]>([]);
  const [eventLinks, setEventLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch chronology events
    const { data: eventsData } = await (supabase as any)
      .from("chronology_events")
      .select("id, title, date, era")
      .order("order_index", { ascending: true })
      .limit(30);

    // Fetch character event links
    const { data: linksData } = await (supabase as any)
      .from("character_event_links")
      .select("*");

    // Fetch character names for enrichment
    const { data: charactersData } = await (supabase as any)
      .from("almanac_characters")
      .select("id, name");

    if (eventsData) {
      setEvents(eventsData as ChronologyEvent[]);
    }

    if (linksData && charactersData) {
      const charMap = new Map(charactersData.map((c: any) => [c.id, c.name]));
      const enrichedLinks = linksData.map((link: any) => ({
        ...link,
        character_name: charMap.get(link.character_id) || "Unknown",
      }));
      setEventLinks(enrichedLinks);
    }

    setLoading(false);
  };

  // Calculate node positions in a grid/flow layout
  const nodePositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {};
    const cols = Math.ceil(Math.sqrt(events.length));
    const cellWidth = 800 / cols;
    const cellHeight = 120;

    events.forEach((event, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions[event.id] = {
        x: 50 + col * cellWidth + cellWidth / 2,
        y: 50 + row * cellHeight + cellHeight / 2,
      };
    });

    return positions;
  }, [events]);

  // Group events by shared characters
  const sharedCharacterLinks = useMemo(() => {
    const links: { source: string; target: string; character: string }[] = [];
    const eventCharacterMap: Record<string, string[]> = {};

    eventLinks.forEach((link) => {
      if (!eventCharacterMap[link.event_id]) {
        eventCharacterMap[link.event_id] = [];
      }
      eventCharacterMap[link.event_id].push(link.character_id);
    });

    const eventIds = Object.keys(eventCharacterMap);
    for (let i = 0; i < eventIds.length; i++) {
      for (let j = i + 1; j < eventIds.length; j++) {
        const shared = eventCharacterMap[eventIds[i]].filter((c) =>
          eventCharacterMap[eventIds[j]].includes(c)
        );
        if (shared.length > 0) {
          const charName = eventLinks.find((l) => l.character_id === shared[0])?.character_name || "Unknown";
          links.push({
            source: eventIds[i],
            target: eventIds[j],
            character: charName,
          });
        }
      }
    }

    return links;
  }, [eventLinks]);

  // Filter links for selected event
  const filteredLinks = useMemo(() => {
    if (!selectedEvent) return sharedCharacterLinks;
    return sharedCharacterLinks.filter(
      (l) => l.source === selectedEvent || l.target === selectedEvent
    );
  }, [sharedCharacterLinks, selectedEvent]);

  // Connected events
  const connectedEvents = useMemo(() => {
    if (!selectedEvent) return new Set(events.map((e) => e.id));
    const connected = new Set<string>([selectedEvent]);
    filteredLinks.forEach((l) => {
      connected.add(l.source);
      connected.add(l.target);
    });
    return connected;
  }, [filteredLinks, selectedEvent, events]);

  const handleEventClick = (eventId: string) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventId);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedEvent(null);
  };

  const getEraColor = (era?: string) => {
    return era ? eraColors[era] || eraColors.default : eraColors.default;
  };

  const svgHeight = Math.max(600, Math.ceil(events.length / Math.ceil(Math.sqrt(events.length))) * 120 + 100);

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <Calendar className="h-5 w-5" />
            Event Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[500px]" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <Calendar className="h-5 w-5" />
            Event Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--parchment-muted))]" />
          <p className="text-[hsl(var(--parchment-muted))]">
            No events found. Add events to the chronology to see connections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
          <Calendar className="h-5 w-5" />
          Event Connections
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(eraColors)
            .filter(([key]) => key !== "default")
            .map(([era, color]) => (
              <Badge
                key={era}
                variant="outline"
                style={{ borderColor: color, color: color }}
              >
                {era}
              </Badge>
            ))}
        </div>

        {/* SVG Graph */}
        <div className="relative overflow-hidden rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]">
          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 800 ${svgHeight}`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "center center",
            }}
          >
            {/* Connection lines */}
            {filteredLinks.map((link, idx) => {
              const source = nodePositions[link.source];
              const target = nodePositions[link.target];
              if (!source || !target) return null;

              return (
                <g key={idx}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="hsl(var(--parchment-gold))"
                    strokeWidth={selectedEvent ? 3 : 1.5}
                    strokeOpacity={selectedEvent ? 0.8 : 0.4}
                    strokeDasharray="4 2"
                  />
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    fill="hsl(var(--parchment-brown))"
                    fontSize="9"
                    textAnchor="middle"
                    dy="-5"
                    className="pointer-events-none"
                  >
                    {link.character}
                  </text>
                </g>
              );
            })}

            {/* Event nodes */}
            {events.map((event) => {
              const pos = nodePositions[event.id];
              if (!pos) return null;
              const isConnected = connectedEvents.has(event.id);
              const isSelected = selectedEvent === event.id;

              return (
                <g
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="cursor-pointer"
                  opacity={isConnected ? 1 : 0.3}
                >
                  <rect
                    x={pos.x - 70}
                    y={pos.y - 25}
                    width={140}
                    height={50}
                    rx={8}
                    fill={isSelected ? "hsl(var(--parchment-gold))" : "hsl(var(--parchment-card))"}
                    stroke={getEraColor(event.era)}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 5}
                    fill="hsl(var(--parchment-brown))"
                    fontSize="11"
                    fontWeight={isSelected ? "bold" : "normal"}
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {event.title.length > 18 ? event.title.slice(0, 18) + "..." : event.title}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 12}
                    fill="hsl(var(--parchment-muted))"
                    fontSize="9"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {event.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected event info */}
        {selectedEvent && (
          <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]">
            {(() => {
              const event = events.find((e) => e.id === selectedEvent);
              if (!event) return null;
              const eventCharLinks = eventLinks.filter((l) => l.event_id === event.id);
              return (
                <div>
                  <h4 className="font-heading font-bold text-lg text-[hsl(var(--parchment-brown))]">
                    {event.title}
                  </h4>
                  <p className="text-sm text-[hsl(var(--parchment-muted))]">{event.date}</p>
                  {event.era && (
                    <Badge
                      variant="outline"
                      className="mt-1"
                      style={{ borderColor: getEraColor(event.era), color: getEraColor(event.era) }}
                    >
                      {event.era}
                    </Badge>
                  )}
                  {eventCharLinks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-[hsl(var(--parchment-brown))]">
                        Characters involved:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {eventCharLinks.map((link) => (
                          <Badge key={link.id} variant="secondary">
                            {link.character_name}
                            {link.role && ` (${link.role})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-2"
                    onClick={() => navigate(`/chronology/${event.id}`)}
                  >
                    View Event Details →
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
