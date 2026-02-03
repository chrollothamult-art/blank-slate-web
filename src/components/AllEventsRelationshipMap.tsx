import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ZoomIn, ZoomOut, RotateCcw, Users, LayoutGrid, Clock, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

interface Character {
  id: string;
  name: string;
}

interface NodePosition {
  x: number;
  y: number;
}

type ViewMode = "map" | "timeline";

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
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [customPositions, setCustomPositions] = useState<Record<string, NodePosition>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: eventsData, error: eventsError } = await supabase
      .from("chronology_events" as any)
      .select("id, title, date, era")
      .order("order_index", { ascending: true })
      .limit(30);

    if (eventsError) {
      console.error("Error fetching chronology events:", eventsError);
    }

    const { data: linksData, error: linksError } = await supabase
      .from("character_event_links" as any)
      .select("*");

    if (linksError) {
      console.error("Error fetching character event links:", linksError);
    }

    const { data: charactersData, error: charsError } = await supabase
      .from("almanac_characters" as any)
      .select("id, name");

    if (charsError) {
      console.error("Error fetching almanac characters:", charsError);
    }

    if (eventsData) {
      setEvents(eventsData as unknown as ChronologyEvent[]);
    }

    if (charactersData) {
      setCharacters(charactersData as unknown as Character[]);
    }

    if (linksData && charactersData) {
      const charMap = new Map((charactersData as any[]).map((c: any) => [c.id, c.name]));
      const enrichedLinks = (linksData as any[]).map((link: any) => ({
        ...link,
        character_name: charMap.get(link.character_id) || "Unknown",
      }));
      setEventLinks(enrichedLinks);
    }

    setLoading(false);
  };

  const eventsWithLinks = useMemo(() => {
    const eventIdsWithLinks = new Set(eventLinks.map(l => l.event_id));
    return events.filter(e => eventIdsWithLinks.has(e.id));
  }, [events, eventLinks]);

  const involvedCharacters = useMemo(() => {
    const charIds = new Set(eventLinks.map(l => l.character_id));
    return characters.filter(c => charIds.has(c.id));
  }, [characters, eventLinks]);

  // Calculate base positions for map view
  const mapPositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {};
    const linkedEvents = eventsWithLinks.length > 0 ? eventsWithLinks : events.slice(0, 8);
    const eventSpacing = Math.min(180, 700 / Math.max(linkedEvents.length, 1));
    const startX = (800 - (linkedEvents.length - 1) * eventSpacing) / 2;
    
    linkedEvents.forEach((event, index) => {
      positions[`event-${event.id}`] = {
        x: startX + index * eventSpacing,
        y: 80,
      };
    });

    const charSpacing = Math.min(150, 700 / Math.max(involvedCharacters.length, 1));
    const charStartX = (800 - (involvedCharacters.length - 1) * charSpacing) / 2;
    
    involvedCharacters.forEach((char, index) => {
      positions[`char-${char.id}`] = {
        x: charStartX + index * charSpacing,
        y: 280,
      };
    });

    return positions;
  }, [events, eventsWithLinks, involvedCharacters]);

  // Calculate positions for timeline view (chronological left-to-right)
  const timelinePositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {};
    const linkedEvents = eventsWithLinks.length > 0 ? eventsWithLinks : events.slice(0, 8);
    
    // Sort events by date for timeline
    const sortedEvents = [...linkedEvents].sort((a, b) => {
      const parseDate = (d: string) => {
        const match = d.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return parseDate(a.date) - parseDate(b.date);
    });

    const eventSpacing = 800 / (sortedEvents.length + 1);
    
    sortedEvents.forEach((event, index) => {
      positions[`event-${event.id}`] = {
        x: eventSpacing * (index + 1),
        y: 100,
      };
    });

    // Position characters below their most connected event
    involvedCharacters.forEach((char) => {
      const charLinks = eventLinks.filter(l => l.character_id === char.id);
      if (charLinks.length > 0) {
        const eventPos = positions[`event-${charLinks[0].event_id}`];
        if (eventPos) {
          positions[`char-${char.id}`] = {
            x: eventPos.x + (Math.random() - 0.5) * 60,
            y: 250 + Math.random() * 50,
          };
        } else {
          positions[`char-${char.id}`] = {
            x: 400 + (Math.random() - 0.5) * 200,
            y: 280,
          };
        }
      }
    });

    return positions;
  }, [events, eventsWithLinks, involvedCharacters, eventLinks]);

  // Get the current node positions based on view mode and custom positions
  const nodePositions = useMemo(() => {
    const basePositions = viewMode === "map" ? mapPositions : timelinePositions;
    return { ...basePositions, ...customPositions };
  }, [viewMode, mapPositions, timelinePositions, customPositions]);

  const visibleLinks = useMemo(() => {
    if (selectedEvent) {
      return eventLinks.filter(l => l.event_id === selectedEvent);
    }
    if (selectedCharacter) {
      return eventLinks.filter(l => l.character_id === selectedCharacter);
    }
    return eventLinks;
  }, [eventLinks, selectedEvent, selectedCharacter]);

  const handleEventClick = (eventId: string) => {
    if (dragging) return;
    setSelectedCharacter(null);
    setSelectedEvent(prev => prev === eventId ? null : eventId);
  };

  const handleCharacterClick = (charId: string) => {
    if (dragging) return;
    setSelectedEvent(null);
    setSelectedCharacter(prev => prev === charId ? null : charId);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedEvent(null);
    setSelectedCharacter(null);
    setCustomPositions({});
  };

  const toggleViewMode = () => {
    setCustomPositions({});
    setViewMode(prev => prev === "map" ? "timeline" : "map");
  };

  const getEraColor = (era?: string) => {
    return era ? eraColors[era] || eraColors.default : eraColors.default;
  };

  // Drag handlers
  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handleDragStart = useCallback((nodeId: string, clientX: number, clientY: number) => {
    const svgPoint = getSVGPoint(clientX, clientY);
    const currentPos = nodePositions[nodeId];
    if (currentPos) {
      setDragOffset({
        x: svgPoint.x - currentPos.x,
        y: svgPoint.y - currentPos.y,
      });
    }
    setDragging(nodeId);
  }, [getSVGPoint, nodePositions]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    const svgPoint = getSVGPoint(clientX, clientY);
    setCustomPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.max(50, Math.min(750, svgPoint.x - dragOffset.x)),
        y: Math.max(30, Math.min(370, svgPoint.y - dragOffset.y)),
      },
    }));
  }, [dragging, getSVGPoint, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => handleDragEnd();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

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

  const linkedEvents = eventsWithLinks.length > 0 ? eventsWithLinks : events.slice(0, 8);
  const hasNoLinks = eventLinks.length === 0;

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <Calendar className="h-5 w-5" />
            Event Connections
          </CardTitle>
          <p className="text-sm text-[hsl(var(--parchment-muted))] mt-1">
            {viewMode === "map" ? "Click to select, drag to reposition" : "Timeline view - events arranged chronologically"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant={viewMode === "map" ? "default" : "outline"} 
            size="sm" 
            onClick={() => viewMode !== "map" && toggleViewMode()}
            className="gap-1"
          >
            <LayoutGrid className="h-4 w-4" />
            Map
          </Button>
          <Button 
            variant={viewMode === "timeline" ? "default" : "outline"} 
            size="sm" 
            onClick={() => viewMode !== "timeline" && toggleViewMode()}
            className="gap-1"
          >
            <Clock className="h-4 w-4" />
            Timeline
          </Button>
          <div className="w-px h-6 bg-[hsl(var(--parchment-border))]" />
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
          <Badge variant="outline" className="border-[hsl(var(--parchment-gold))] text-[hsl(var(--parchment-brown))]">
            <Calendar className="h-3 w-3 mr-1" /> Events
          </Badge>
          <Badge variant="outline" className="border-[hsl(173,80%,40%)] text-[hsl(173,80%,40%)]">
            <Users className="h-3 w-3 mr-1" /> Characters
          </Badge>
          <Badge variant="outline" className="border-[hsl(var(--parchment-muted))] text-[hsl(var(--parchment-muted))]">
            <GripVertical className="h-3 w-3 mr-1" /> Drag to move
          </Badge>
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

        {hasNoLinks && (
          <div className="mb-4 p-3 bg-[hsl(var(--parchment-bg))] rounded-lg border border-[hsl(var(--parchment-border))]">
            <p className="text-sm text-[hsl(var(--parchment-muted))]">
              No character-event links found. Link characters to events in the admin panel to see connections here.
            </p>
          </div>
        )}

        {/* SVG Graph */}
        <div className="relative overflow-hidden rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]">
          {/* Timeline axis for timeline view */}
          <AnimatePresence>
            {viewMode === "timeline" && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-2 left-0 right-0 flex justify-center z-10"
              >
                <div className="bg-[hsl(var(--parchment-card))] px-4 py-1 rounded-full border border-[hsl(var(--parchment-border))] shadow-sm">
                  <span className="text-xs text-[hsl(var(--parchment-muted))]">← Past</span>
                  <span className="mx-4 text-xs font-medium text-[hsl(var(--parchment-brown))]">Timeline</span>
                  <span className="text-xs text-[hsl(var(--parchment-muted))]">Future →</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <svg
            ref={svgRef}
            width="100%"
            height={400}
            viewBox="0 0 800 400"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "center center",
              cursor: dragging ? "grabbing" : "default",
            }}
          >
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(45, 93%, 47%)" />
                <stop offset="100%" stopColor="hsl(173, 80%, 40%)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="dropShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
              </filter>
            </defs>

            {/* Timeline line for timeline view */}
            {viewMode === "timeline" && (
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                x1={50}
                y1={100}
                x2={750}
                y2={100}
                stroke="hsl(var(--parchment-border))"
                strokeWidth={3}
                strokeDasharray="8 4"
              />
            )}

            {/* Connection lines */}
            {visibleLinks.map((link, idx) => {
              const eventPos = nodePositions[`event-${link.event_id}`];
              const charPos = nodePositions[`char-${link.character_id}`];
              if (!eventPos || !charPos) return null;

              const isHighlighted = selectedEvent === link.event_id || selectedCharacter === link.character_id;
              const isHovered = hoveredEvent === link.event_id || hoveredCharacter === link.character_id;
              const isActive = isHighlighted || isHovered;

              return (
                <g key={idx}>
                  {isActive && (
                    <motion.line
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      x1={eventPos.x}
                      y1={eventPos.y + 25}
                      x2={charPos.x}
                      y2={charPos.y - 25}
                      stroke="url(#connectionGradient)"
                      strokeWidth={8}
                      filter="url(#glow)"
                      className="pointer-events-none"
                    />
                  )}
                  <motion.line
                    initial={false}
                    animate={{
                      x1: eventPos.x,
                      y1: eventPos.y + 25,
                      x2: charPos.x,
                      y2: charPos.y - 25,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    stroke="url(#connectionGradient)"
                    strokeWidth={isActive ? 3 : 2}
                    strokeOpacity={isActive ? 1 : 0.5}
                    strokeDasharray={isActive ? "8 4" : "none"}
                    className={isActive ? "animate-[dash_1s_linear_infinite]" : ""}
                  />
                  {isActive && (
                    <>
                      <circle r={4} fill="hsl(45, 93%, 60%)">
                        <animateMotion
                          dur="1.5s"
                          repeatCount="indefinite"
                          path={`M${eventPos.x},${eventPos.y + 25} L${charPos.x},${charPos.y - 25}`}
                        />
                      </circle>
                      <circle r={3} fill="hsl(173, 80%, 50%)">
                        <animateMotion
                          dur="1.5s"
                          repeatCount="indefinite"
                          begin="0.5s"
                          path={`M${eventPos.x},${eventPos.y + 25} L${charPos.x},${charPos.y - 25}`}
                        />
                      </circle>
                    </>
                  )}
                  {link.role && (
                    <motion.text
                      initial={false}
                      animate={{
                        x: (eventPos.x + charPos.x) / 2,
                        y: (eventPos.y + 25 + charPos.y - 25) / 2,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      fill="hsl(var(--parchment-brown))"
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none"
                      fontWeight={isActive ? "bold" : "normal"}
                    >
                      {link.role}
                    </motion.text>
                  )}
                </g>
              );
            })}

            {/* Event nodes */}
            {linkedEvents.map((event) => {
              const pos = nodePositions[`event-${event.id}`];
              if (!pos) return null;
              const isSelected = selectedEvent === event.id;
              const isHovered = hoveredEvent === event.id;
              const isDraggingThis = dragging === `event-${event.id}`;
              const hasLink = eventLinks.some(l => l.event_id === event.id);
              const isConnectedToChar = selectedCharacter ? eventLinks.some(l => l.event_id === event.id && l.character_id === selectedCharacter) : true;
              const isConnectedToHoveredChar = hoveredCharacter ? eventLinks.some(l => l.event_id === event.id && l.character_id === hoveredCharacter) : false;

              return (
                <motion.g
                  key={event.id}
                  initial={false}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    opacity: selectedCharacter && !isConnectedToChar ? 0.3 : 1,
                    scale: isDraggingThis ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => handleEventClick(event.id)}
                  onMouseEnter={() => !dragging && setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onMouseDown={(e) => handleDragStart(`event-${event.id}`, e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      handleDragStart(`event-${event.id}`, e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  className="cursor-grab active:cursor-grabbing"
                  filter={isDraggingThis ? "url(#dropShadow)" : undefined}
                >
                  {(isHovered || isConnectedToHoveredChar) && (
                    <rect
                      x={-75}
                      y={-30}
                      width={150}
                      height={60}
                      rx={12}
                      fill="hsl(var(--parchment-gold))"
                      opacity={0.2}
                      filter="url(#glow)"
                    />
                  )}
                  <rect
                    x={-70}
                    y={-25}
                    width={140}
                    height={50}
                    rx={8}
                    fill={isSelected ? "hsl(var(--parchment-gold))" : "hsl(var(--parchment-card))"}
                    stroke={hasLink ? getEraColor(event.era) : "hsl(var(--parchment-border))"}
                    strokeWidth={isSelected || isHovered || isDraggingThis ? 3 : 2}
                  />
                  <text
                    x={0}
                    y={-5}
                    fill="hsl(var(--parchment-brown))"
                    fontSize="11"
                    fontWeight={isSelected || isHovered ? "bold" : "normal"}
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {event.title.length > 16 ? event.title.slice(0, 16) + "..." : event.title}
                  </text>
                  <text
                    x={0}
                    y={12}
                    fill="hsl(var(--parchment-muted))"
                    fontSize="9"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {event.date}
                  </text>
                </motion.g>
              );
            })}

            {/* Character nodes */}
            {involvedCharacters.map((char) => {
              const pos = nodePositions[`char-${char.id}`];
              if (!pos) return null;
              const isSelected = selectedCharacter === char.id;
              const isHovered = hoveredCharacter === char.id;
              const isDraggingThis = dragging === `char-${char.id}`;
              const isConnectedToEvent = selectedEvent ? eventLinks.some(l => l.character_id === char.id && l.event_id === selectedEvent) : true;
              const isConnectedToHoveredEvent = hoveredEvent ? eventLinks.some(l => l.character_id === char.id && l.event_id === hoveredEvent) : false;

              return (
                <motion.g
                  key={char.id}
                  initial={false}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    opacity: selectedEvent && !isConnectedToEvent ? 0.3 : 1,
                    scale: isDraggingThis ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => handleCharacterClick(char.id)}
                  onMouseEnter={() => !dragging && setHoveredCharacter(char.id)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                  onMouseDown={(e) => handleDragStart(`char-${char.id}`, e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      handleDragStart(`char-${char.id}`, e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  className="cursor-grab active:cursor-grabbing"
                  filter={isDraggingThis ? "url(#dropShadow)" : undefined}
                >
                  {(isHovered || isConnectedToHoveredEvent) && (
                    <circle
                      cx={0}
                      cy={0}
                      r={35}
                      fill="hsl(173, 80%, 40%)"
                      opacity={0.2}
                      filter="url(#glow)"
                    />
                  )}
                  <circle
                    cx={0}
                    cy={0}
                    r={28}
                    fill={isSelected ? "hsl(173, 80%, 40%)" : "hsl(var(--parchment-card))"}
                    stroke="hsl(173, 80%, 40%)"
                    strokeWidth={isSelected || isHovered || isDraggingThis ? 3 : 2}
                  />
                  {isHovered && (
                    <circle
                      cx={0}
                      cy={0}
                      r={28}
                      fill="none"
                      stroke="hsl(173, 80%, 50%)"
                      strokeWidth={2}
                      opacity={0.6}
                    >
                      <animate
                        attributeName="r"
                        from="28"
                        to="40"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.6"
                        to="0"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <text
                    x={0}
                    y={4}
                    fill={isSelected || isHovered ? "white" : "hsl(var(--parchment-brown))"}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {char.name.charAt(0)}
                  </text>
                  <text
                    x={0}
                    y={45}
                    fill="hsl(var(--parchment-brown))"
                    fontSize="10"
                    fontWeight={isHovered ? "bold" : "normal"}
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {char.name.length > 12 ? char.name.slice(0, 12) + "..." : char.name}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Selected info panel */}
        <AnimatePresence>
          {(selectedEvent || selectedCharacter) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-4 rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]"
            >
              {selectedEvent && (() => {
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
                    {eventCharLinks.length > 0 ? (
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
                    ) : (
                      <p className="text-sm text-[hsl(var(--parchment-muted))] mt-2">
                        No characters linked to this event yet.
                      </p>
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
              {selectedCharacter && (() => {
                const char = characters.find((c) => c.id === selectedCharacter);
                if (!char) return null;
                const charEventLinks = eventLinks.filter((l) => l.character_id === char.id);
                return (
                  <div>
                    <h4 className="font-heading font-bold text-lg text-[hsl(var(--parchment-brown))]">
                      {char.name}
                    </h4>
                    {charEventLinks.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-[hsl(var(--parchment-brown))]">
                          Events involving this character:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {charEventLinks.map((link) => {
                            const event = events.find(e => e.id === link.event_id);
                            return (
                              <Badge key={link.id} variant="secondary">
                                {event?.title || "Unknown Event"}
                                {link.role && ` (${link.role})`}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[hsl(var(--parchment-muted))] mt-2">
                        No events linked to this character yet.
                      </p>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
