import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, TrendingUp, Shield, Crown, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface FactionStats {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  campaign_id: string;
  campaign_name: string;
  member_count: number;
  total_reputation: number;
  avg_reputation: number;
  active_members: number;
}

interface TopMember {
  character_id: string;
  character_name: string;
  portrait_url: string | null;
  faction_id: string;
  faction_name: string;
  reputation_score: number;
  rank: string | null;
}

export const FactionLeaderboard = () => {
  const [factionStats, setFactionStats] = useState<FactionStats[]>([]);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("popular");

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setLoading(true);

    // Fetch all factions with member stats
    const { data: factions } = await supabase
      .from("rp_campaign_factions")
      .select(`
        id, name, description, image_url, campaign_id,
        campaign:rp_campaigns(title)
      `);

    if (!factions) {
      setLoading(false);
      return;
    }

    // Fetch member standings for all factions
    const { data: standings } = await supabase
      .from("rp_character_faction_standing")
      .select("campaign_faction_id, reputation_score, is_member, rank, character_id");

    const standingsMap = new Map<string, typeof standings>();
    standings?.forEach((s) => {
      const existing = standingsMap.get(s.campaign_faction_id) || [];
      existing.push(s);
      standingsMap.set(s.campaign_faction_id, existing);
    });

    // Calculate stats for each faction
    const stats: FactionStats[] = factions.map((f) => {
      const factionStandings = standingsMap.get(f.id) || [];
      const members = factionStandings.filter((s) => s.is_member);
      const totalRep = factionStandings.reduce((sum, s) => sum + (s.reputation_score || 0), 0);
      const campaign = f.campaign as { title: string } | null;

      return {
        id: f.id,
        name: f.name,
        description: f.description,
        image_url: f.image_url,
        campaign_id: f.campaign_id,
        campaign_name: campaign?.title || "Unknown Campaign",
        member_count: members.length,
        total_reputation: totalRep,
        avg_reputation: factionStandings.length > 0 ? Math.round(totalRep / factionStandings.length) : 0,
        active_members: members.filter((m) => (m.reputation_score || 0) > 0).length,
      };
    });

    // Sort by member count for popularity
    stats.sort((a, b) => b.member_count - a.member_count);
    setFactionStats(stats);

    // Fetch top faction members
    const { data: characterStandings } = await supabase
      .from("rp_character_faction_standing")
      .select(`
        campaign_faction_id, reputation_score, rank, character_id,
        character:rp_characters(name, portrait_url),
        faction:rp_campaign_factions(name)
      `)
      .eq("is_member", true)
      .order("reputation_score", { ascending: false })
      .limit(20);

    if (characterStandings) {
      const topMembersList: TopMember[] = characterStandings.map((s) => {
        const char = s.character as { name: string; portrait_url: string | null } | null;
        const faction = s.faction as { name: string } | null;
        return {
          character_id: s.character_id,
          character_name: char?.name || "Unknown",
          portrait_url: char?.portrait_url || null,
          faction_id: s.campaign_faction_id,
          faction_name: faction?.name || "Unknown Faction",
          reputation_score: s.reputation_score || 0,
          rank: s.rank,
        };
      });
      setTopMembers(topMembersList);
    }

    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <Star className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const maxMembers = Math.max(...factionStats.map((f) => f.member_count), 1);
  const maxReputation = Math.max(...factionStats.map((f) => f.avg_reputation), 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Faction Leaderboard</CardTitle>
          </div>
          <CardDescription>
            See which factions are dominating across all campaigns
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="popular" className="gap-2">
            <Users className="h-4 w-4" />
            Most Popular
          </TabsTrigger>
          <TabsTrigger value="reputation" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Highest Reputation
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Trophy className="h-4 w-4" />
            Top Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="space-y-4 mt-4">
          {factionStats.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Factions Yet</h3>
                <p className="text-muted-foreground">
                  Factions will appear here once campaigns create them.
                </p>
              </CardContent>
            </Card>
          ) : (
            factionStats.slice(0, 10).map((faction, index) => (
              <motion.div
                key={faction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index)}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={faction.image_url || ""} />
                        <AvatarFallback className="bg-primary/10">
                          {faction.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{faction.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {faction.campaign_name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {faction.description || "No description"}
                        </p>
                        <div className="mt-2">
                          <Progress 
                            value={(faction.member_count / maxMembers) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold">{faction.member_count}</p>
                        <p className="text-xs text-muted-foreground">members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="reputation" className="space-y-4 mt-4">
          {[...factionStats]
            .sort((a, b) => b.avg_reputation - a.avg_reputation)
            .slice(0, 10)
            .map((faction, index) => (
              <motion.div
                key={faction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index)}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={faction.image_url || ""} />
                        <AvatarFallback className="bg-primary/10">
                          {faction.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{faction.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {faction.campaign_name}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <Progress 
                            value={(faction.avg_reputation / maxReputation) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold">{faction.avg_reputation}</p>
                        <p className="text-xs text-muted-foreground">avg reputation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </TabsContent>

        <TabsContent value="members" className="space-y-4 mt-4">
          {topMembers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground">
                  Top faction members will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            topMembers.map((member, index) => (
              <motion.div
                key={`${member.character_id}-${member.faction_id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index)}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.portrait_url || ""} />
                        <AvatarFallback>
                          {member.character_name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{member.character_name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {member.faction_name}
                          </Badge>
                          {member.rank && (
                            <Badge variant="outline" className="text-xs">
                              {member.rank}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">{member.reputation_score}</p>
                        <p className="text-xs text-muted-foreground">reputation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
