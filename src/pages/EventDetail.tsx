import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventRelationshipMap } from "@/components/EventRelationshipMap";

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
      <div className="min-h-screen bg-[#e8dcc8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl" style={{ color: '#2c1810' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#e8dcc8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold mb-4" style={{ color: '#2c1810' }}>
            Event Not Found
          </h1>
          <Button onClick={() => navigate('/chronology')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chronology
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = allEvents.findIndex((e) => e.id === eventId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8dcc8' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/chronology")}
          className="mb-6"
          style={{ color: '#2c1810' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Timeline
        </Button>

        <Card style={{ backgroundColor: '#f5f0e8', borderColor: '#d4a574' }} className="shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#8a7a6a' }}>
              <Calendar className="h-4 w-4" />
              <span className="font-mono">{event.date}</span>
              <Separator orientation="vertical" className="h-4" style={{ backgroundColor: '#d4a574' }} />
              <Clock className="h-4 w-4" />
              <span>{getEraName(event.era)}</span>
            </div>
            
            <CardTitle className="text-4xl font-heading" style={{ color: '#2c1810' }}>
              {event.title}
            </CardTitle>
            
            <p className="text-lg italic border-l-4 pl-4" style={{ color: '#5a4a3a', borderColor: '#c85a3e' }}>
              {event.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator style={{ backgroundColor: '#d4a574' }} />
            
            <div className="prose max-w-none">
              <h2 className="text-2xl font-heading mb-4" style={{ color: '#2c1810' }}>Chronicle</h2>
              <p className="leading-relaxed whitespace-pre-line" style={{ color: '#2c1810' }}>
                {event.article}
              </p>
            </div>

            <Separator style={{ backgroundColor: '#d4a574' }} />

            <div className="p-4 rounded-lg" style={{ backgroundColor: '#e8dcc8' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#8a7a6a' }}>
                Historical Context
              </h3>
              <p className="text-sm" style={{ color: '#5a4a3a' }}>
                This event occurred during the era known as {getEraName(event.era)},
                a period that shaped the course of world history and left lasting impacts
                on civilization, magic, and the very fabric of reality itself.
              </p>
            </div>

            <Separator style={{ backgroundColor: '#d4a574' }} />

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
    </div>
  );
};

export default EventDetail;
