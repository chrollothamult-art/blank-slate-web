import { useState } from "react";
import { motion } from "framer-motion";
import { Book, Search, Star, Users, MapPin, Sword, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCommunityLore, CommunityLoreEntry } from "@/hooks/useCommunityLore";
import { formatDistanceToNow } from "date-fns";

const categoryIcons: Record<string, React.ReactNode> = {
  race: <Users className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  item: <Sword className="h-4 w-4" />,
  faction: <Star className="h-4 w-4" />,
  ability: <Sparkles className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  race: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  location: "bg-green-500/10 text-green-600 border-green-500/20",
  item: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  faction: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ability: "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

export const CommunityLoreAlmanac = () => {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<CommunityLoreEntry | null>(null);
  
  const { entries, featuredEntries, loading, incrementViewCount } = useCommunityLore(category);

  const filteredEntries = entries.filter(entry =>
    entry.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewEntry = (entry: CommunityLoreEntry) => {
    setSelectedEntry(entry);
    incrementViewCount(entry.id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-t-lg" />
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <Book className="h-6 w-6 text-primary" />
          Community Lore Almanac
        </h2>
        <p className="text-muted-foreground">
          Explore lore created and approved by the community
        </p>
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
              <FeaturedLoreCard 
                key={entry.id} 
                entry={entry} 
                index={index}
                onClick={() => handleViewEntry(entry)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search community lore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={category} onValueChange={setCategory} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-6">
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
          </TabsList>
        </Tabs>
      </div>

      {/* Entries Grid */}
      {filteredEntries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Community Lore Yet</h3>
            <p className="text-muted-foreground mb-4">
              {entries.length === 0 
                ? "Submit a lore proposal to add to the community almanac!"
                : "No entries match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry, index) => (
            <LoreCard 
              key={entry.id} 
              entry={entry} 
              index={index}
              onClick={() => handleViewEntry(entry)}
            />
          ))}
        </div>
      )}

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
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
                  <img 
                    src={selectedEntry.image_url} 
                    alt={selectedEntry.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {selectedEntry.article && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{selectedEntry.article}</div>
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
                  <span>Created by {selectedEntry.creator?.username || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {selectedEntry.view_count} views
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FeaturedLoreCard = ({ 
  entry, 
  index, 
  onClick 
}: { 
  entry: CommunityLoreEntry; 
  index: number;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-primary/5"
      onClick={onClick}
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
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={categoryColors[entry.category]}>
            {categoryIcons[entry.category]}
            <span className="ml-1 capitalize">{entry.category}</span>
          </Badge>
        </div>
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
);

const LoreCard = ({ 
  entry, 
  index, 
  onClick 
}: { 
  entry: CommunityLoreEntry; 
  index: number;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.03, 0.3) }}
  >
    <Card 
      className="overflow-hidden cursor-pointer hover:border-primary/40 transition-colors group"
      onClick={onClick}
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
          {entry.is_featured && (
            <Star className="h-3 w-3 text-primary fill-primary" />
          )}
        </div>
        
        <h4 className="font-semibold text-sm line-clamp-1">{entry.name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{entry.description}</p>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{entry.creator?.username || "Unknown"}</span>
          <span>{formatDistanceToNow(new Date(entry.approved_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
