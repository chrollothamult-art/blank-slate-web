import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Users, Castle, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import worldMapImage from "@/assets/world-map.jpg";

interface Location {
  id: string;
  name: string;
  type: "kingdom" | "city" | "landmark" | "region";
  description: string;
  x_position: number;
  y_position: number;
  color?: string;
}

interface Character {
  id: string;
  name: string;
  image_url: string | null;
  origin_location_id: string | null;
  affiliation: string | null;
}

const locationTypeIcons: Record<string, React.ReactNode> = {
  kingdom: <Castle className="h-4 w-4" />,
  city: <MapPin className="h-4 w-4" />,
  landmark: <MapPin className="h-4 w-4" />,
  region: <MapPin className="h-4 w-4" />,
};

const locationTypeColors: Record<string, string> = {
  kingdom: "hsl(45, 93%, 47%)",
  city: "hsl(173, 80%, 40%)",
  landmark: "hsl(262, 83%, 58%)",
  region: "hsl(var(--parchment-brown))",
};

export const InteractiveWorldMap = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: locationsData, error: locationsError } = await supabase
      .from("world_locations" as any)
      .select("*")
      .order("name");

    if (locationsError) {
      console.error("Error fetching locations:", locationsError);
    }

    const { data: charactersData, error: charactersError } = await supabase
      .from("almanac_characters" as any)
      .select("id, name, image_url, origin_location_id, affiliation");

    if (charactersError) {
      console.error("Error fetching characters:", charactersError);
    }

    if (locationsData) {
      setLocations(locationsData as unknown as Location[]);
    }

    if (charactersData) {
      setCharacters(charactersData as unknown as Character[]);
    }

    setLoading(false);
  };

  const charactersAtLocation = useMemo(() => {
    if (!selectedLocation) return [];
    return characters.filter(c => c.origin_location_id === selectedLocation.id);
  }, [selectedLocation, characters]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedLocation(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <MapPin className="h-5 w-5" />
            Interactive World Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[500px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <MapPin className="h-5 w-5" />
            Interactive World Map
          </CardTitle>
          <p className="text-sm text-[hsl(var(--parchment-muted))] mt-1">
            Click locations to explore kingdoms and character origins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-[hsl(var(--parchment-muted))] min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
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
          {Object.entries(locationTypeColors).map(([type, color]) => (
            <Badge
              key={type}
              variant="outline"
              className="capitalize"
              style={{ borderColor: color, color: color }}
            >
              {locationTypeIcons[type]}
              <span className="ml-1">{type}</span>
            </Badge>
          ))}
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-12 bg-[hsl(var(--parchment-bg))] rounded-lg border border-[hsl(var(--parchment-border))]">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--parchment-muted))]" />
            <p className="text-[hsl(var(--parchment-muted))]">
              No locations found. Add locations in the admin panel to populate the map.
            </p>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Map Container */}
            <div 
              className="relative flex-1 overflow-hidden rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]"
              style={{ height: "500px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: "center center",
                  transition: isPanning ? "none" : "transform 0.2s ease-out",
                }}
              >
                {/* World Map Background */}
                <img
                  src={worldMapImage}
                  alt="World Map"
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Location Markers */}
                {locations.map((location) => {
                  const isSelected = selectedLocation?.id === location.id;
                  const isHovered = hoveredLocation === location.id;
                  const color = location.color || locationTypeColors[location.type] || locationTypeColors.region;

                  return (
                    <motion.div
                      key={location.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: Math.random() * 0.3, type: "spring" }}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${location.x_position}%`,
                        top: `${location.y_position}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocation(isSelected ? null : location);
                      }}
                      onMouseEnter={() => setHoveredLocation(location.id)}
                      onMouseLeave={() => setHoveredLocation(null)}
                    >
                      {/* Glow effect */}
                      {(isSelected || isHovered) && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.4 }}
                          className="absolute inset-0 rounded-full"
                          style={{
                            backgroundColor: color,
                            filter: "blur(8px)",
                            width: "40px",
                            height: "40px",
                            left: "-8px",
                            top: "-8px",
                          }}
                        />
                      )}

                      {/* Marker */}
                      <motion.div
                        animate={{
                          scale: isSelected ? 1.2 : isHovered ? 1.1 : 1,
                          y: isSelected || isHovered ? -4 : 0,
                        }}
                        className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full shadow-lg"
                        style={{
                          backgroundColor: isSelected ? color : "hsl(var(--parchment-card))",
                          border: `2px solid ${color}`,
                        }}
                      >
                        <MapPin 
                          className="h-3 w-3" 
                          style={{ color: isSelected ? "white" : color }}
                        />
                      </motion.div>

                      {/* Label */}
                      <AnimatePresence>
                        {(isSelected || isHovered) && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap"
                          >
                            <div 
                              className="px-2 py-1 rounded text-xs font-medium shadow-lg"
                              style={{
                                backgroundColor: "hsl(var(--parchment-card))",
                                color: "hsl(var(--parchment-brown))",
                                border: `1px solid ${color}`,
                              }}
                            >
                              {location.name}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Pulse ring for selected */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            border: `2px solid ${color}`,
                            width: "24px",
                            height: "24px",
                          }}
                          animate={{
                            scale: [1, 2],
                            opacity: [0.6, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Info Panel */}
            <AnimatePresence>
              {selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 300 }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="h-[500px] bg-[hsl(var(--parchment-bg))] border-[hsl(var(--parchment-border))]">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <CardTitle className="text-lg text-[hsl(var(--parchment-brown))]">
                          {selectedLocation.name}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className="mt-1 capitalize"
                          style={{
                            borderColor: locationTypeColors[selectedLocation.type],
                            color: locationTypeColors[selectedLocation.type],
                          }}
                        >
                          {selectedLocation.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLocation(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[380px] pr-4">
                        <p className="text-sm text-[hsl(var(--parchment-muted))] mb-4">
                          {selectedLocation.description || "No description available."}
                        </p>

                        {charactersAtLocation.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-[hsl(var(--parchment-brown))] mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Characters from here
                            </h4>
                            <div className="space-y-2">
                              {charactersAtLocation.map((char) => (
                                <div
                                  key={char.id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--parchment-card))] border border-[hsl(var(--parchment-border))]"
                                >
                                  {char.image_url ? (
                                    <img
                                      src={char.image_url}
                                      alt={char.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--parchment-gold))] flex items-center justify-center">
                                      <span className="text-sm font-bold text-[hsl(var(--parchment-brown))]">
                                        {char.name.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-sm text-[hsl(var(--parchment-brown))]">
                                      {char.name}
                                    </p>
                                    {char.affiliation && (
                                      <p className="text-xs text-[hsl(var(--parchment-muted))]">
                                        {char.affiliation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
