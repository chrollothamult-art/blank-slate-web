import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { almanacCategories } from "@/data/chronologyData";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Castle, Sparkles, Users, Crown, MapPin, Wand2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import worldMap from "@/assets/world-map.jpg";

const iconMap = {
  Castle,
  Sparkles,
  Users,
  Crown,
  MapPin,
  Wand2,
  BookOpen
};

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  era: string;
  description: string;
}

export const ChronologyTimeline = () => {
  const navigate = useNavigate();
  const [activeEra, setActiveEra] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("chronology_events")
      .select("id, title, date, era, description")
      .order("order_index", { ascending: true });

    if (data) {
      setTimelineEvents(data);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/chronology/${eventId}`);
  };

  const handleAlmanacClick = (categoryId: string) => {
    navigate(`/almanac/${categoryId}`);
  };

  const getEraColor = (era: string) => {
    switch (era) {
      case "BGD":
        return "from-amber-900/20 to-orange-900/20 border-amber-700/50";
      case "GD":
        return "from-purple-900/20 to-indigo-900/20 border-purple-700/50";
      case "AGD":
        return "from-blue-900/20 to-cyan-900/20 border-blue-700/50";
      default:
        return "from-muted to-muted/50 border-border";
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf6f0' }}>
      {/* Hero Banner with World Map */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img 
          src={worldMap} 
          alt="World Map of the Realms" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#faf6f0]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white drop-shadow-2xl">
              Chronology of the Realms
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg font-medium">
              Journey Through the Ages
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Timeline Section - Centered */}
          <div className="flex-1">
            <div className="relative max-w-5xl mx-auto">
              {/* Central Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5" style={{ backgroundColor: '#d4af37' }} />

              <div className="space-y-24">
                {timelineEvents.map((event, index) => {
                  const isLeft = index % 2 === 0;
                  const showMarker = index === 0 || timelineEvents[index - 1].era !== event.era;

                  return (
                    <div key={event.id} className="relative min-h-[120px] flex items-center">
                      {/* Era marker on timeline */}
                      {showMarker && (
                        <div 
                          className="absolute left-1/2 -ml-4 w-8 h-8 rounded-full border-4 z-10"
                          style={{ backgroundColor: '#d4af37', borderColor: '#faf6f0' }}
                        />
                      )}

                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <div
                            onClick={() => handleEventClick(event.id)}
                            className={cn(
                              "cursor-pointer transition-all duration-300",
                              "w-[45%]",
                              isLeft ? "mr-auto pr-8 text-right" : "ml-auto pl-8 text-left"
                            )}
                          >
                            {/* Era label */}
                            {showMarker && (
                              <p className="text-sm mb-2 font-medium" style={{ color: '#b8860b' }}>
                                {event.era === 'BGD' ? 'The Age of Beasts' : 
                                 event.era === 'GD' ? 'The Great Darkening' : 
                                 'After Great Darkening'}
                              </p>
                            )}
                            
                            {/* Event title */}
                            <h3 
                              className="text-2xl font-heading font-bold mb-2 hover:opacity-80 transition-opacity"
                              style={{ color: '#3d2817' }}
                            >
                              {event.title}
                            </h3>
                            
                            {/* Date */}
                            <p className="text-lg font-semibold" style={{ color: '#d4af37' }}>
                              {event.date}
                            </p>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          side={isLeft ? "left" : "right"}
                          className="w-96 bg-[#fffef8] border-[#d4af37] shadow-xl"
                        >
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg" style={{ color: '#3d2817' }}>
                              {event.title}
                            </h4>
                            <p className="text-sm leading-relaxed" style={{ color: '#5a4a3a' }}>
                              {event.description}
                            </p>
                            <Separator className="my-2" style={{ backgroundColor: '#d4af37' }} />
                            <p className="text-xs italic" style={{ color: '#8a7a6a' }}>
                              Click to read the full chronicle
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Witnesses Almanac Sidebar */}
          <div className="lg:w-80 lg:border-l lg:pl-8 lg:sticky lg:top-4 lg:self-start" style={{ borderColor: '#d4af37' }}>
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold mb-2" style={{ color: '#3d2817' }}>
                Witnesses Almanac
              </h3>
              <p className="text-sm" style={{ color: '#5a4a3a' }}>Explore the world's lore</p>
            </div>

            <div className="space-y-2">
              {almanacCategories.map((category) => {
                const Icon = iconMap[category.icon as keyof typeof iconMap];
                return (
                  <button
                    key={category.id}
                    onClick={() => handleAlmanacClick(category.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-200 text-left group border"
                    style={{ 
                      backgroundColor: '#fffef8',
                      borderColor: '#d4af37'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5ecd0';
                      e.currentTarget.style.borderColor = '#b8860b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fffef8';
                      e.currentTarget.style.borderColor = '#d4af37';
                    }}
                  >
                    <Icon className="w-5 h-5 transition-colors" style={{ color: '#8a7a6a' }} />
                    <span className="font-medium" style={{ color: '#3d2817' }}>
                      {category.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
