import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ZoomIn, ZoomOut, RotateCcw, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Character {
  id: string;
  name: string;
  role?: string;
  affiliation?: string;
  image_url?: string;
}

interface Relationship {
  id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  description?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  character: Character;
}


const relationshipColors: Record<string, string> = {
  ally: "#22c55e",
  enemy: "#ef4444",
  mentor: "#eab308",
  student: "#3b82f6",
  rival: "#f97316",
  friend: "#14b8a6",
  lover: "#ec4899",
  servant: "#6b7280",
  master: "#d97706",
  parent: "#8b5cf6",
  child: "#a855f7",
  spouse: "#ec4899",
  sibling: "#3b82f6",
  grandparent: "#eab308",
  grandchild: "#f97316",
  uncle_aunt: "#14b8a6",
  nephew_niece: "#10b981",
  cousin: "#22c55e",
  ancestor: "#6366f1",
  descendant: "#0ea5e9",
  default: "#9ca3af",
};

export const DynamicRelationshipMap = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const draggedNodeRef = useRef<Node | null>(null);
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Character | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 400),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Observe container size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: charactersData } = await supabase
      .from("almanac_characters" as any)
      .select("id, name, role, affiliation, image_url")
      .order("order_index", { ascending: true });

    const { data: relationshipsData } = await supabase
      .from("character_relationships" as any)
      .select("*");

    if (charactersData) {
      setCharacters(charactersData as unknown as Character[]);
      // Initialize nodes with random positions based on current dimensions
      const { width, height } = dimensions;
      nodesRef.current = (charactersData as unknown as Character[]).map((char, i) => ({
        id: char.id,
        x: width / 2 + (Math.random() - 0.5) * Math.min(300, width * 0.4),
        y: height / 2 + (Math.random() - 0.5) * Math.min(300, height * 0.4),
        vx: 0,
        vy: 0,
        character: char,
      }));
    }
    if (relationshipsData) {
      setRelationships(relationshipsData as unknown as Relationship[]);
    }
    
    setLoading(false);
  };

  // Force simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const { width, height } = dimensions;
    if (!nodes.length || !isSimulating) return;

    const centerX = width / 2;
    const centerY = height / 2;
    
    // Apply forces
    nodes.forEach((node, i) => {
      // Center gravity
      node.vx += (centerX - node.x) * 0.001;
      node.vy += (centerY - node.y) * 0.001;

      // Repulsion between all nodes
      nodes.forEach((other, j) => {
        if (i === j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 2000 / (dist * dist);
        node.vx += (dx / dist) * force;
        node.vy += (dy / dist) * force;
      });
    });

    // Attraction along edges
    relationships.forEach((rel) => {
      const source = nodes.find((n) => n.id === rel.character_id);
      const target = nodes.find((n) => n.id === rel.related_character_id);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 150) * 0.01;

      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    });

    // Update positions with damping - NO boundary constraints (infinite canvas)
    nodes.forEach((node) => {
      if (draggedNodeRef.current?.id === node.id) return;
      
      node.vx *= 0.9;
      node.vy *= 0.9;
      node.x += node.vx;
      node.y += node.vy;
      // Nodes can now extend infinitely in any direction
    });
  }, [relationships, isSimulating, dimensions]);

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear with theme-aware gradient background
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    if (isDarkMode) {
      gradient.addColorStop(0, "hsl(220, 35%, 14%)");
      gradient.addColorStop(1, "hsl(220, 40%, 10%)");
    } else {
      gradient.addColorStop(0, "hsl(45, 35%, 97%)");
      gradient.addColorStop(1, "hsl(45, 25%, 93%)");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Apply zoom and pan transform for nodes and edges
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    const nodes = nodesRef.current;
    const filteredRels = selectedCharacter
      ? relationships.filter(
          (r) => r.character_id === selectedCharacter || r.related_character_id === selectedCharacter
        )
      : relationships;

    // Draw edges
    filteredRels.forEach((rel) => {
      const source = nodes.find((n) => n.id === rel.character_id);
      const target = nodes.find((n) => n.id === rel.related_character_id);
      if (!source || !target) return;

      const color = relationshipColors[rel.relationship_type.toLowerCase()] || relationshipColors.default;
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = selectedCharacter ? 3 : 2;
      ctx.globalAlpha = selectedCharacter ? 0.8 : 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Edge label
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      ctx.fillStyle = color;
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(rel.relationship_type, midX, midY - 5);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isConnected = !selectedCharacter || 
        selectedCharacter === node.id ||
        filteredRels.some(
          (r) => r.character_id === node.id || r.related_character_id === node.id
        );
      const isSelected = selectedCharacter === node.id;
      const isHovered = hoveredNode?.id === node.id;

      ctx.globalAlpha = isConnected ? 1 : 0.3;

      // Glow effect for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 40, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(node.x, node.y, 20, node.x, node.y, 40);
        gradient.addColorStop(0, isDarkMode ? "rgba(250, 204, 21, 0.4)" : "rgba(212, 175, 55, 0.4)");
        gradient.addColorStop(1, isDarkMode ? "rgba(250, 204, 21, 0)" : "rgba(212, 175, 55, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Node circle - original size
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 32 : 28, 0, Math.PI * 2);
      if (isDarkMode) {
        ctx.fillStyle = isSelected ? "#fbbf24" : "#1f2937";
      } else {
        ctx.fillStyle = isSelected ? "#d4af37" : "#faf7f0";
      }
      ctx.fill();
      if (isDarkMode) {
        ctx.strokeStyle = isSelected ? "#f59e0b" : "#4b5563";
      } else {
        ctx.strokeStyle = isSelected ? "#8b4513" : "#d4c4a8";
      }
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = isDarkMode ? "#e5e7eb" : "#5d4e37";
      ctx.font = isSelected ? "bold 11px system-ui" : "11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const name = node.character.name.length > 12 
        ? node.character.name.slice(0, 12) + "..." 
        : node.character.name;
      ctx.fillText(name, node.x, node.y + 45);

      // Initial letter
      ctx.font = "bold 16px system-ui";
      ctx.textBaseline = "middle";
      ctx.fillText(node.character.name.charAt(0), node.x, node.y + 5);

      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [relationships, selectedCharacter, hoveredNode, dimensions, isDarkMode, zoom, pan]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      simulate();
      render();
      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [simulate, render]);

  // Transform screen coordinates to world coordinates (accounting for zoom and pan)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const { width, height } = dimensions;
    // Reverse the zoom and pan transform
    const worldX = (screenX - width / 2 - pan.x) / zoom + width / 2;
    const worldY = (screenY - height / 2 - pan.y) / zoom + height / 2;
    return { x: worldX, y: worldY };
  }, [dimensions, zoom, pan]);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { width, height } = dimensions;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (width / rect.width);
    const screenY = (e.clientY - rect.top) * (height / rect.height);

    // Handle panning
    if (isPanning) {
      const deltaX = e.clientX - lastPanPos.current.x;
      const deltaY = e.clientY - lastPanPos.current.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    // Convert to world coordinates
    const { x, y } = screenToWorld(screenX, screenY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // Check hover with zoom-adjusted hit radius
    const hitRadius = 30 / zoom; // Adjust hit radius based on zoom
    const hovered = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < hitRadius;
    });
    setHoveredNode(hovered?.character || null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { width, height } = dimensions;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (width / rect.width);
    const screenY = (e.clientY - rect.top) * (height / rect.height);
    
    // Convert to world coordinates
    const { x, y } = screenToWorld(screenX, screenY);

    // Adjust hit radius based on zoom level
    const hitRadius = 30 / zoom;
    const clicked = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < hitRadius;
    });

    if (clicked) {
      draggedNodeRef.current = clicked;
    } else {
      // Start panning if no node clicked
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current) {
      // If barely moved, treat as click
      setSelectedCharacter((prev) =>
        prev === draggedNodeRef.current?.id ? null : draggedNodeRef.current?.id || null
      );
    }
    draggedNodeRef.current = null;
    setIsPanning(false);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.1, Math.min(3, z + delta)));
  };

  const handleReset = () => {
    setSelectedCharacter(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const { width, height } = dimensions;
    // Randomize positions
    nodesRef.current.forEach((node) => {
      node.x = width / 2 + (Math.random() - 0.5) * Math.min(300, width * 0.4);
      node.y = height / 2 + (Math.random() - 0.5) * Math.min(300, height * 0.4);
      node.vx = 0;
      node.vy = 0;
    });
  };

  // Fit all nodes in view
  const handleFitView = () => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    const graphWidth = maxX - minX + 100;
    const graphHeight = maxY - minY + 100;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const { width, height } = dimensions;
    const scaleX = width / graphWidth;
    const scaleY = height / graphHeight;
    const newZoom = Math.min(scaleX, scaleY, 1) * 0.9;

    setZoom(newZoom);
    setPan({
      x: (width / 2 - centerX) * newZoom,
      y: (height / 2 - centerY) * newZoom,
    });
  };

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <Users className="h-5 w-5" />
            Character Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="h-8 w-full rounded-full" />
              </motion.div>
            ))}
          </div>
          <Skeleton className="w-full h-[500px] rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (characters.length === 0) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <Users className="h-5 w-5" />
            Character Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--parchment-muted))]" />
          <p className="text-[hsl(var(--parchment-muted))]">
            No characters found. Add characters to the almanac to see the relationship map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
          <Users className="h-5 w-5" />
          Character Relationships
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(z => Math.max(0.1, z - 0.25))}
              disabled={zoom <= 0.1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleFitView}
            className="transition-all hover:scale-105 text-xs px-2"
          >
            Fit All
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsSimulating(!isSimulating)}
            className="transition-all hover:scale-105"
          >
            {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleReset}
            className="transition-all hover:scale-105"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
          }}
        >
          {Object.entries(relationshipColors)
            .filter(([key]) => key !== "default")
            .map(([type, color]) => (
              <motion.div
                key={type}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 },
                }}
              >
                <Badge
                  variant="outline"
                  className="capitalize cursor-pointer transition-all hover:scale-105"
                  style={{ borderColor: color, color: color }}
                >
                  {type.replace("_", " ")}
                </Badge>
              </motion.div>
            ))}
        </motion.div>

        {/* Canvas Graph */}
        <div 
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))] w-full"
          style={{ minHeight: '600px', height: '600px' }}
        >
          <canvas
            ref={canvasRef}
            style={{ 
              width: '100%', 
              height: '100%', 
              cursor: isPanning ? "grabbing" : (hoveredNode ? "pointer" : "grab"),
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onMouseLeave={() => {
              draggedNodeRef.current = null;
              setHoveredNode(null);
              setIsPanning(false);
            }}
          />
          
          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border"
              >
                <p className="font-semibold">{hoveredNode.name}</p>
                {hoveredNode.role && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {hoveredNode.role}
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected character info */}
        <AnimatePresence>
          {selectedCharacter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-2xl bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]"
            >
              {(() => {
                const char = characters.find((c) => c.id === selectedCharacter);
                if (!char) return null;
                const charRelationships = relationships.filter(
                  (r) => r.character_id === char.id || r.related_character_id === char.id
                );
                return (
                  <div>
                    <h4 className="font-heading font-bold text-lg text-[hsl(var(--parchment-brown))]">
                      {char.name}
                    </h4>
                    {char.role && (
                      <Badge variant="outline" className="mt-1">
                        {char.role}
                      </Badge>
                    )}
                    <p className="text-sm text-[hsl(var(--parchment-muted))] mt-2">
                      {charRelationships.length} relationship{charRelationships.length !== 1 ? "s" : ""}
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto mt-2"
                      onClick={() => navigate("/almanac/characters")}
                    >
                      View in Almanac →
                    </Button>
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
