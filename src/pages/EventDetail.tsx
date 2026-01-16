import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventRelationshipMap } from "@/components/EventRelationshipMap";
import { Footer } from "@/components/Footer";

interface Event {
  id: string;
  title: string;
  date: string;
  era: string;
  description: string;
  article: string;
}

export const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [eventId]);

  const fetchEvents = async () => {
    const { data: eventsData, error: eventsError } = await supabase
      .from("chronology_events")
      .select("*")
      .order("order_index", { ascending: true });

    if (eventsData) {
      setAllEvents(eventsData);
      const currentEvent = eventsData.find((e: Event) => e.id === eventId);
      setEvent(currentEvent || null);
    }
    setLoading(false);
  };

  const getEraName = (era: string) => {
    switch (era) {
      case "BGD":
        return "Before the Great Darkening";
      case "GD":
        return "The Great Darkening";
      case "AGD":
        return "After the Great Darkening";
      default:
        return era;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-[hsl(var(--parchment-brown))]">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4 text-[hsl(var(--parchment-brown))]">
              Event Not Found
            </h1>
            <Button onClick={() => navigate('/chronology')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chronology
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentIndex = allEvents.findIndex((e) => e.id === eventId);

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/chronology")}
          className="mb-6 text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-card))]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Timeline
        </Button>

        <Card className="shadow-xl bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--parchment-light-muted))]">
              <Calendar className="h-4 w-4" />
              <span className="font-mono">{event.date}</span>
              <Separator orientation="vertical" className="h-4 bg-[hsl(var(--parchment-border))]" />
              <Clock className="h-4 w-4" />
              <span>{getEraName(event.era)}</span>
            </div>
            
            <CardTitle className="text-4xl font-heading text-[hsl(var(--parchment-brown))]">
              {event.title}
            </CardTitle>
            
            <p className="text-lg italic border-l-4 pl-4 text-[hsl(var(--parchment-muted))] border-[hsl(var(--parchment-gold))]">
              {event.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator className="bg-[hsl(var(--parchment-border))]" />
            
            <div className="prose max-w-none">
              <h2 className="text-2xl font-heading mb-4 text-[hsl(var(--parchment-brown))]">Chronicle</h2>
              <p className="leading-relaxed whitespace-pre-line text-[hsl(var(--parchment-brown))]">
                {event.article}
              </p>
            </div>

            <Separator className="bg-[hsl(var(--parchment-border))]" />

            <div className="p-4 rounded-lg bg-[hsl(var(--parchment-bg))]">
              <h3 className="text-sm font-semibold mb-2 text-[hsl(var(--parchment-light-muted))]">
                Historical Context
              </h3>
              <p className="text-sm text-[hsl(var(--parchment-muted))]">
                This event occurred during the era known as {getEraName(event.era)},
                a period that shaped the course of world history and left lasting impacts
                on civilization, magic, and the very fabric of reality itself.
              </p>
            </div>

            <Separator className="bg-[hsl(var(--parchment-border))]" />

            <EventRelationshipMap eventId={eventId || ""} eventTitle={event.title} />

            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  if (currentIndex > 0) {
                    navigate(`/chronology/${allEvents[currentIndex - 1].id}`);
                  }
                }}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Event
              </Button>

              <Button 
                variant="outline"
                onClick={() => {
                  if (currentIndex < allEvents.length - 1) {
                    navigate(`/chronology/${allEvents[currentIndex + 1].id}`);
                  }
                }}
                disabled={currentIndex === allEvents.length - 1}
              >
                Next Event
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default EventDetail;
