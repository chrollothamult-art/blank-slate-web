import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { almanacCategories } from "@/data/chronologyData";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Castle, Sparkles, Users, Crown, MapPin, Wand2, BookOpen, User, Calendar, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import worldMap from "@/assets/world-map.jpg";

const iconMap = {
  Castle,
  Sparkles,
  Users,
  Crown,
  MapPin,
  Wand2,
  BookOpen,
  User
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await (supabase
      .from("chronology_events" as any)
      .select("id, title, date, era, description")
      .order("order_index", { ascending: true })) as any;

    if (data) {
      setTimelineEvents(data as TimelineEvent[]);
    }
    setLoading(false);
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
    <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
      {/* Hero Banner with World Map */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img 
          src={worldMap} 
          alt="World Map of the Realms" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[hsl(var(--parchment-bg))]" />
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
      <div className="flex-1 container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Timeline Section - Centered */}
          <div className="flex-1">
            <div className="relative max-w-5xl mx-auto">
              {/* Central Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5 bg-[hsl(var(--parchment-gold))]" />

              {loading ? (
                <div className="space-y-16">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="relative min-h-[120px] flex items-center">
                      {/* Era marker skeleton */}
                      <Skeleton className="absolute left-1/2 -ml-4 w-8 h-8 rounded-full z-10" />
                      
                      <div className={cn(
                        "w-[45%]",
                        index % 2 === 0 ? "mr-auto pr-8" : "ml-auto pl-8"
                      )}>
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-8 w-full mb-3" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timelineEvents.length === 0 ? (
                /* Empty State */
                <div className="text-center py-24">
                  <Calendar className="w-16 h-16 mx-auto mb-6 text-[hsl(var(--parchment-gold))]" />
                  <h3 className="text-2xl font-heading font-bold mb-3 text-[hsl(var(--parchment-brown))]">
                    No Events Yet
                  </h3>
                  <p className="text-[hsl(var(--parchment-muted))] max-w-md mx-auto">
                    The chronicles are still being written. Check back later as the history of the Realms unfolds.
                  </p>
                </div>
              ) : (
                <div className="space-y-24">
                  {timelineEvents.map((event, index) => {
                    const isLeft = index % 2 === 0;
                    const showMarker = index === 0 || timelineEvents[index - 1].era !== event.era;

                    return (
                      <div key={event.id} className="relative min-h-[120px] flex items-center">
                        {/* Era marker on timeline */}
                        {showMarker && (
                          <div 
                            className="absolute left-1/2 -ml-4 w-8 h-8 rounded-full border-4 z-10 bg-[hsl(var(--parchment-gold))] border-[hsl(var(--parchment-bg))]"
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
                                <p className="text-sm mb-2 font-medium text-[hsl(var(--parchment-gold))]">
                                  {event.era === 'BGD' ? 'The Age of Beasts' : 
                                   event.era === 'GD' ? 'The Great Darkening' : 
                                   'After Great Darkening'}
                                </p>
                              )}
                              
                              {/* Event title */}
                              <h3 className="text-2xl font-heading font-bold mb-2 hover:opacity-80 transition-opacity text-[hsl(var(--parchment-brown))]">
                                {event.title}
                              </h3>
                              
                              {/* Date */}
                              <p className="text-lg font-semibold text-[hsl(var(--parchment-gold))]">
                                {event.date}
                              </p>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            side={isLeft ? "left" : "right"}
                            className="w-96 bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-gold))] shadow-xl"
                          >
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-[hsl(var(--parchment-brown))]">
                                {event.title}
                              </h4>
                              <p className="text-sm leading-relaxed text-[hsl(var(--parchment-muted))]">
                                {event.description}
                              </p>
                              <Separator className="my-2 bg-[hsl(var(--parchment-gold))]" />
                              <p className="text-xs italic text-[hsl(var(--parchment-light-muted))]">
                                Click to read the full chronicle
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Witnesses Almanac Sidebar */}
          <div className="lg:w-80 lg:border-l lg:pl-8 lg:sticky lg:top-4 lg:self-start border-[hsl(var(--parchment-gold))]">
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold mb-2 text-[hsl(var(--parchment-brown))]">
                Witnesses Almanac
              </h3>
              <p className="text-sm text-[hsl(var(--parchment-muted))]">Explore the world's lore</p>
            </div>

            <div className="space-y-2">
              {almanacCategories.map((category) => {
                const Icon = iconMap[category.icon as keyof typeof iconMap];
                return (
                  <button
                    key={category.id}
                    onClick={() => handleAlmanacClick(category.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-200 text-left group border bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-gold))] hover:bg-[hsl(var(--parchment-bg))] hover:border-[hsl(var(--parchment-border))]"
                  >
                    <Icon className="w-5 h-5 transition-colors text-[hsl(var(--parchment-light-muted))]" />
                    <span className="font-medium text-[hsl(var(--parchment-brown))]">
                      {category.title}
                    </span>
                  </button>
                  );
                })}
            </div>

            {/* Relationships Map Link */}
            <Separator className="my-6 bg-[hsl(var(--parchment-border))]" />
            <button
              onClick={() => navigate("/relationships")}
              className="w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-200 text-left group border bg-[hsl(var(--parchment-gold))/10] border-[hsl(var(--parchment-gold))] hover:bg-[hsl(var(--parchment-gold))/20]"
            >
              <Network className="w-5 h-5 text-[hsl(var(--parchment-gold))]" />
              <div>
                <span className="font-medium text-[hsl(var(--parchment-brown))]">
                  Relationships Map
                </span>
                <p className="text-xs text-[hsl(var(--parchment-muted))]">
                  View character & event connections
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
