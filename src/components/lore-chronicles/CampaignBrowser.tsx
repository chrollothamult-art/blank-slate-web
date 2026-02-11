import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, Play, Star, Search, MessageSquare, FileEdit, Trash2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLoreChronicles, RpCampaign } from "@/hooks/useLoreChronicles";

const genreColors: Record<string, string> = {
  adventure: "bg-green-500/10 text-green-600 border-green-500/20",
  mystery: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  horror: "bg-red-500/10 text-red-600 border-red-500/20",
  romance: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  fantasy: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  political: "bg-amber-500/10 text-amber-600 border-amber-500/20"
};

const difficultyConfig: Record<string, { color: string; stars: number; icon: string }> = {
  easy: { color: "text-green-600", stars: 1, icon: "⭐" },
  normal: { color: "text-yellow-600", stars: 2, icon: "⭐⭐" },
  hard: { color: "text-orange-600", stars: 3, icon: "⭐⭐⭐" },
  nightmare: { color: "text-red-600", stars: 4, icon: "💀" },
};

export const CampaignBrowser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { campaigns, draftCampaigns, loading } = useLoreChronicles();
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genreFilter === "all" || campaign.genre === genreFilter;
    const matchesDifficulty = difficultyFilter === "all" || campaign.difficulty === difficultyFilter;
    return matchesSearch && matchesGenre && matchesDifficulty;
  });

  const featuredCampaigns = campaigns.filter(c => c.is_featured);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-40 bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* My Drafts Section */}
      {user && draftCampaigns.length > 0 && !search && genreFilter === "all" && difficultyFilter === "all" && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-amber-500" />
            My Drafts
            <Badge variant="secondary" className="ml-1">{draftCampaigns.length}</Badge>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full flex flex-col overflow-hidden group hover:border-amber-500/40 transition-colors border-amber-500/20 bg-amber-500/5">
                  <div className="relative h-32 bg-gradient-to-br from-amber-500/20 to-accent/20 overflow-hidden">
                    {campaign.cover_image_url ? (
                      <img src={campaign.cover_image_url} alt={campaign.title} className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PenTool className="h-12 w-12 text-amber-500/30" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white">Draft</Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{campaign.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {campaign.description || "No description yet..."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className={genreColors[campaign.genre] || ""}>
                        {campaign.genre}
                      </Badge>
                      <span>{campaign.difficulty}</span>
                      <span>·</span>
                      <span>Updated {new Date(campaign.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/lore-chronicles/edit-campaign/${campaign.id}`)}>
                      <FileEdit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {/* Featured Campaigns Section */}
      {featuredCampaigns.length > 0 && genreFilter === "all" && difficultyFilter === "all" && !search && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            Featured Campaigns
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.slice(0, 3).map((campaign, index) => (
              <CampaignCard key={campaign.id} campaign={campaign} index={index} featured />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            <SelectItem value="adventure">Adventure</SelectItem>
            <SelectItem value="mystery">Mystery</SelectItem>
            <SelectItem value="horror">Horror</SelectItem>
            <SelectItem value="romance">Romance</SelectItem>
            <SelectItem value="fantasy">Fantasy</SelectItem>
            <SelectItem value="political">Political</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="nightmare">Nightmare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* All Campaigns Header */}
      {(search || genreFilter !== "all" || difficultyFilter !== "all") && filteredCampaigns.length > 0 && (
        <h2 className="text-xl font-bold">
          {search ? `Results for "${search}"` : "Filtered Campaigns"}
          <span className="text-muted-foreground font-normal text-base ml-2">
            ({filteredCampaigns.length} found)
          </span>
        </h2>
      )}

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Campaigns Found</h3>
            <p className="text-muted-foreground mb-4">
              {campaigns.length === 0 
                ? "Be the first to create a campaign!" 
                : "Try adjusting your filters"}
            </p>
            <Button onClick={() => navigate('/lore-chronicles/create-campaign')}>
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          {!search && genreFilter === "all" && difficultyFilter === "all" && featuredCampaigns.length > 0 && (
            <h2 className="text-xl font-bold mb-4">All Campaigns</h2>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns
              .filter(c => search || genreFilter !== "all" || difficultyFilter !== "all" || !c.is_featured)
              .map((campaign, index) => (
                <CampaignCard key={campaign.id} campaign={campaign} index={index} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CampaignCard = ({ campaign, index, featured = false }: { campaign: RpCampaign & { average_rating?: number; review_count?: number }; index: number; featured?: boolean }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`h-full flex flex-col overflow-hidden group hover:border-primary/40 transition-colors ${featured ? "border-primary/30 bg-primary/5" : ""}`}>
        {/* Cover Image */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {campaign.cover_image_url ? (
            <img
              src={campaign.cover_image_url}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-primary/30" />
            </div>
          )}
          
          {campaign.is_featured && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{campaign.title}</CardTitle>
            <Badge 
              variant="outline" 
              className={genreColors[campaign.genre] || ""}
            >
              {campaign.genre}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {campaign.description || "An adventure awaits..."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pb-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs gap-1 ${difficultyConfig[campaign.difficulty]?.color || ""}`}
            >
              <span>{difficultyConfig[campaign.difficulty]?.icon || "⭐"}</span>
              {campaign.difficulty.charAt(0).toUpperCase() + campaign.difficulty.slice(1)}
            </Badge>
            {campaign.estimated_duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{campaign.estimated_duration} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {campaign.play_count}
            </span>
          </div>
          
          {/* Rating display */}
          {(campaign.average_rating !== undefined && campaign.average_rating > 0) && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(campaign.average_rating || 0)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {campaign.average_rating?.toFixed(1)} ({campaign.review_count})
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between">
          {campaign.author && (
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={campaign.author.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {campaign.author.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{campaign.author.username}</span>
            </div>
          )}
          <Button 
            size="sm" 
            onClick={() => navigate(`/lore-chronicles/play/${campaign.id}`)}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
