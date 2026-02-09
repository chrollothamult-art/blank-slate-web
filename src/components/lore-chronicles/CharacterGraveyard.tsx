import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Skull, Calendar, MapPin, Sword, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FallenCharacter {
  id: string;
  name: string;
  portrait_url: string | null;
  level: number;
  xp: number;
  race_name: string | null;
  fallen_at: string | null;
  death_context: {
    campaign_title?: string;
    cause?: string;
    node_title?: string;
  } | null;
}

export const CharacterGraveyard = () => {
  const { user } = useAuth();
  const [fallen, setFallen] = useState<FallenCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFallen = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("rp_characters")
        .select(`
          id, name, portrait_url, level, xp, fallen_at, death_context,
          race:almanac_races(name)
        `)
        .eq("user_id", user.id)
        .eq("is_active", false)
        .not("fallen_at", "is", null)
        .order("fallen_at", { ascending: false });

      if (error) {
        console.error("Error fetching fallen characters:", error);
        setLoading(false);
        return;
      }

      setFallen(
        (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          portrait_url: c.portrait_url,
          level: c.level,
          xp: c.xp,
          race_name: (c.race as any)?.name || null,
          fallen_at: c.fallen_at,
          death_context: c.death_context as FallenCharacter["death_context"],
        }))
      );
      setLoading(false);
    };

    fetchFallen();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading graveyard...</div>
        </CardContent>
      </Card>
    );
  }

  if (fallen.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-muted-foreground" />
            Character Graveyard
          </CardTitle>
          <CardDescription>
            No fallen characters yet. May your heroes endure!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skull className="h-5 w-5 text-muted-foreground" />
          Character Graveyard
        </CardTitle>
        <CardDescription>
          Heroes who fell during their adventures — their legacy lives on
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fallen.map((char, index) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-muted-foreground/10"
            >
              <Avatar className="h-14 w-14 border-2 border-muted-foreground/20 grayscale">
                <AvatarImage src={char.portrait_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {char.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{char.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    Level {char.level}
                  </Badge>
                </div>

                {char.race_name && (
                  <p className="text-sm text-muted-foreground">{char.race_name}</p>
                )}

                {char.death_context?.cause && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Sword className="h-3 w-3" />
                    {char.death_context.cause}
                  </p>
                )}

                {char.death_context?.campaign_title && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {char.death_context.campaign_title}
                  </p>
                )}

                {char.fallen_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fell on {new Date(char.fallen_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CharacterGraveyard;
