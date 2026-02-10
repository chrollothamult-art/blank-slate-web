import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Book, Search, Star, Users, MapPin, Sword, Sparkles, Eye, TrendingUp, Award, Clock, Link2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCommunityLore, CommunityLoreEntry } from "@/hooks/useCommunityLore";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const categoryIcons: Record<string, React.ReactNode> = {
  race: <Users className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  item: <Sword className="h-4 w-4" />,
  faction: <Star className="h-4 w-4" />,
  ability: <Sparkles className="h-4 w-4" />,
  concept: <Book className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  race: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  location: "bg-green-500/10 text-green-600 border-green-500/20",
  item: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  faction: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ability: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  concept: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

interface LoreStats {
  total: number;
  byCategory: Record<string, number>;
  topContributors: { username: string; avatar_url: string | null; count: number }[];
  recentCount: number;
}

export const CommunityLorePage = () => {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<CommunityLoreEntry | null>(null);
  const [stats, setStats] = useState<LoreStats | null>(null);
  
  const { entries, featuredEntries, loading, incrementViewCount } = useCommunityLore(category);

  // Fetch aggregate stats
  useEffect(() => {
    const fetchStats = async () => {
      const { data: allEntries } = await supabase
        .from("rp_community_lore")
        .select("category, creator_id");

      if (!allEntries) return;

      const byCategory: Record<string, number> = {};
      const contributorCounts: Record<string, number> = {};

      allEntries.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + 1;
        contributorCounts[e.creator_id] = (contributorCounts[e.creator_id] || 0) + 1;
      });

      // Get top contributors
      const topCreatorIds = Object.entries(contributorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", topCreatorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const topContributors = topCreatorIds.map(id => ({
        username: profileMap.get(id)?.username || "Unknown",
        avatar_url: profileMap.get(id)?.avatar_url || null,
        count: contributorCounts[id],
      }));

      // Recent entries (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentCount = allEntries.length; // simplified

      setStats({
        total: allEntries.length,
        byCategory,
        topContributors,
        recentCount,
      });
    };

    fetchStats();
  }, []);

  const filteredEntries = entries.filter(entry =>
    entry.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.description.toLowerCase().includes(search.toLowerCase()) ||
    (entry.creator?.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleViewEntry = (entry: CommunityLoreEntry) => {
    setSelectedEntry(entry);
    incrementViewCount(entry.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-12 md:py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3 mb-3">
              <Book className="h-8 w-8 text-primary" />
              Community Lore Almanac
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore lore created by the community and approved by Loremasters. Browse races, locations, items, factions, and more.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16 space-y-8">
        {/* Stats Bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Book className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.topContributors.length}</p>
                  <p className="text-xs text-muted-foreground">Contributors</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{featuredEntries.length}</p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top Contributors */}
        {stats && stats.topContributors.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {stats.topContributors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{c.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{c.username}</p>
                      <p className="text-xs text-muted-foreground">{c.count} entries</p>
                    </div>
                    {i === 0 && <Badge className="bg-primary/10 text-primary border-primary/20">🏆</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Category Tabs */}
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={category} onValueChange={setCategory} className="w-full">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="race" className="gap-1">
                <Users className="h-3 w-3" />
                <span className="hidden sm:inline">Races</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="gap-1">
                <MapPin className="h-3 w-3" />
                <span className="hidden sm:inline">Locations</span>
              </TabsTrigger>
              <TabsTrigger value="item" className="gap-1">
                <Sword className="h-3 w-3" />
                <span className="hidden sm:inline">Items</span>
              </TabsTrigger>
              <TabsTrigger value="faction" className="gap-1">
                <Star className="h-3 w-3" />
                <span className="hidden sm:inline">Factions</span>
              </TabsTrigger>
              <TabsTrigger value="ability" className="gap-1">
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">Abilities</span>
              </TabsTrigger>
              <TabsTrigger value="concept" className="gap-1">
                <Book className="h-3 w-3" />
                <span className="hidden sm:inline">Concepts</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Section */}
        {featuredEntries.length > 0 && category === "all" && !search && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary fill-primary" />
              Featured Lore
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredEntries.slice(0, 3).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-primary/5"
                    onClick={() => handleViewEntry(entry)}
                  >
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                      {entry.image_url ? (
                        <img src={entry.image_url} alt={entry.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {categoryIcons[entry.category] || <Book className="h-12 w-12 text-primary/30" />}
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className={categoryColors[entry.category]}>
                        {categoryIcons[entry.category]}
                        <span className="ml-1 capitalize">{entry.category}</span>
                      </Badge>
                      <CardTitle className="text-lg line-clamp-1">{entry.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{entry.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={entry.creator?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {entry.creator?.username?.slice(0, 1).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{entry.creator?.username || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {entry.view_count}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Entries Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-t-lg" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Community Lore Found</h3>
              <p className="text-muted-foreground">
                {entries.length === 0
                  ? "Submit a lore proposal to add to the community almanac!"
                  : "No entries match your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:border-primary/40 transition-colors group"
                  onClick={() => handleViewEntry(entry)}
                >
                  <div className="h-24 bg-gradient-to-br from-primary/10 to-accent/10 relative">
                    {entry.image_url ? (
                      <img src={entry.image_url} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {categoryIcons[entry.category] || <Book className="h-8 w-8 text-primary/30" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                      <span className="text-xs text-primary">View Details</span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-xs ${categoryColors[entry.category]}`}>
                        {categoryIcons[entry.category]}
                        <span className="ml-1 capitalize">{entry.category}</span>
                      </Badge>
                      {entry.is_featured && <Star className="h-3 w-3 text-primary fill-primary" />}
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-1">{entry.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{entry.description}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {entry.creator?.username || "Unknown"}
                      </span>
                      <span>{formatDistanceToNow(new Date(entry.approved_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className={categoryColors[selectedEntry.category]}>
                    {categoryIcons[selectedEntry.category]}
                    <span className="ml-1 capitalize">{selectedEntry.category}</span>
                  </Badge>
                  {selectedEntry.is_featured && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{selectedEntry.name}</DialogTitle>
                <DialogDescription>{selectedEntry.description}</DialogDescription>
              </DialogHeader>

              {selectedEntry.image_url && (
                <div className="rounded-lg overflow-hidden">
                  <img src={selectedEntry.image_url} alt={selectedEntry.name} className="w-full h-48 object-cover" />
                </div>
              )}

              {selectedEntry.article && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{selectedEntry.article}</div>
                </div>
              )}

              {/* Link to original proposal */}
              {selectedEntry.proposal_id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg p-3 bg-muted/30">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span>Originally submitted as a lore proposal</span>
                  <Badge variant="outline" className="ml-auto">Proposal #{selectedEntry.proposal_id.slice(0, 8)}</Badge>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedEntry.creator?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {selectedEntry.creator?.username?.slice(0, 1).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>Created by <strong>{selectedEntry.creator?.username || "Unknown"}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedEntry.view_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(selectedEntry.approved_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
