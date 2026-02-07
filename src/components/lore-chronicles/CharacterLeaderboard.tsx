import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Crown, TrendingUp, Sword } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  name: string;
  portrait_url: string | null;
  level: number;
  xp: number;
  race_name: string | null;
  user: {
    username: string;
    avatar_url: string | null;
  } | null;
}

const RANK_ICONS = [
  { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10" },
];

export const CharacterLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"xp" | "level">("xp");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      // Fetch top characters
      const { data: characters, error } = await supabase
        .from("rp_characters")
        .select(`
          id,
          name,
          portrait_url,
          level,
          xp,
          user_id,
          race:almanac_races(name)
        `)
        .order(sortBy, { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set((characters || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, { username: p.username, avatar_url: p.avatar_url }])
      );

      const entries: LeaderboardEntry[] = (characters || []).map(c => ({
        id: c.id,
        name: c.name,
        portrait_url: c.portrait_url,
        level: c.level,
        xp: c.xp,
        race_name: (c.race as { name: string } | null)?.name || null,
        user: profilesMap.get(c.user_id) || null
      }));

      setLeaderboard(entries);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [sortBy]);

  const getRankDisplay = (index: number) => {
    if (index < 3) {
      const RankIcon = RANK_ICONS[index].icon;
      return (
        <div className={`w-8 h-8 rounded-full ${RANK_ICONS[index].bg} flex items-center justify-center`}>
          <RankIcon className={`h-4 w-4 ${RANK_ICONS[index].color}`} />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Character Leaderboard
            </CardTitle>
            <CardDescription>
              Top adventurers in the realm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "xp" | "level")} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xp" className="gap-2">
              <Star className="h-4 w-4" />
              By XP
            </TabsTrigger>
            <TabsTrigger value="level" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              By Level
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sword className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No characters yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  index < 3 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                }`}
              >
                {getRankDisplay(index)}
                
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={entry.portrait_url || ""} />
                  <AvatarFallback className="bg-primary/10">
                    {entry.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{entry.name}</p>
                    {entry.race_name && (
                      <Badge variant="outline" className="text-xs">
                        {entry.race_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    by {entry.user?.username || "Unknown"}
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{entry.xp.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Level {entry.level}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
