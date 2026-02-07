import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, User, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LinkedCharacter {
  id: string;
  name: string;
  role?: string;
  image_url?: string;
  role_in_event?: string;
}

interface LinkedEvent {
  id: string;
  title: string;
  date: string;
  era: string;
  role_in_event?: string;
}

interface CrossLinkedEntriesProps {
  type: "character" | "event";
  entityId: string;
}

export const CrossLinkedEntries = ({ type, entityId }: CrossLinkedEntriesProps) => {
  const navigate = useNavigate();
  const [linkedItems, setLinkedItems] = useState<LinkedCharacter[] | LinkedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinkedItems();
  }, [type, entityId]);

  const fetchLinkedItems = async () => {
    setLoading(true);

    try {
      if (type === "event") {
        // Get characters linked to this event
        const { data: links } = await supabase
          .from("character_event_links" as any)
          .select("character_id, role_in_event, description")
          .eq("event_id", entityId);

        if (links && links.length > 0) {
          const linksArray = links as unknown as Array<{
            character_id: string;
            role_in_event?: string;
            description?: string;
          }>;
          const characterIds = linksArray.map((l) => l.character_id);
          const { data: characters } = await supabase
            .from("almanac_characters" as any)
            .select("id, name, role, image_url")
            .in("id", characterIds);

          if (characters) {
            const charactersArray = characters as unknown as Array<{
              id: string;
              name: string;
              role?: string;
              image_url?: string;
            }>;
            const linkedCharacters = charactersArray.map((char) => {
              const link = linksArray.find((l) => l.character_id === char.id);
              return {
                ...char,
                role_in_event: link?.role_in_event,
              };
            });
            setLinkedItems(linkedCharacters);
          }
        } else {
          setLinkedItems([]);
        }
      } else {
        // Get events linked to this character
        const { data: links } = await supabase
          .from("character_event_links" as any)
          .select("event_id, role_in_event, description")
          .eq("character_id", entityId);

        if (links && links.length > 0) {
          const linksArray = links as unknown as Array<{
            event_id: string;
            role_in_event?: string;
            description?: string;
          }>;
          const eventIds = linksArray.map((l) => l.event_id);
          const { data: events } = await supabase
            .from("chronology_events" as any)
            .select("id, title, date, era")
            .in("id", eventIds);

          if (events) {
            const eventsArray = events as unknown as Array<{
              id: string;
              title: string;
              date: string;
              era: string;
            }>;
            const linkedEvents = eventsArray.map((event) => {
              const link = linksArray.find((l) => l.event_id === event.id);
              return {
                ...event,
                role_in_event: link?.role_in_event,
              };
            });
            setLinkedItems(linkedEvents);
          }
        } else {
          setLinkedItems([]);
        }
      }
    } catch (error) {
      console.error("Error fetching linked items:", error);
      setLinkedItems([]);
    }

    setLoading(false);
  };

  const handleItemClick = (item: LinkedCharacter | LinkedEvent) => {
    if (type === "event") {
      navigate("/almanac/characters");
    } else {
      navigate(`/chronology/${(item as LinkedEvent).id}`);
    }
  };

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[hsl(var(--parchment-brown))]">
            <Link2 className="h-4 w-4" />
            {type === "event" ? "Characters in this Event" : "Related Events"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (linkedItems.length === 0) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[hsl(var(--parchment-brown))]">
            <Link2 className="h-4 w-4" />
            {type === "event" ? "Characters in this Event" : "Related Events"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(var(--parchment-muted))] text-center py-4">
            No {type === "event" ? "characters" : "events"} linked yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[hsl(var(--parchment-brown))]">
          <Link2 className="h-4 w-4" />
          {type === "event" ? "Characters in this Event" : "Related Events"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {linkedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-[hsl(var(--parchment-bg))] border border-transparent hover:border-[hsl(var(--parchment-border))]"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--parchment-gold))] flex items-center justify-center">
                {type === "event" ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Calendar className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[hsl(var(--parchment-brown))] truncate">
                  {type === "event"
                    ? (item as LinkedCharacter).name
                    : (item as LinkedEvent).title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.role_in_event && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.role_in_event}
                    </Badge>
                  )}
                  {type === "character" && (item as LinkedEvent).date && (
                    <span className="text-xs text-[hsl(var(--parchment-muted))]">
                      {(item as LinkedEvent).date}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
