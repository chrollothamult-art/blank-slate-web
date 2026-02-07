import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Crown, Sparkles, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useCharacterShowcase, ShowcaseCharacter } from "@/hooks/useCharacterShowcase";

const statIcons: Record<string, string> = {
  strength: "💪",
  magic: "✨",
  charisma: "💬",
  wisdom: "📚",
  agility: "⚡"
};

export const CharacterShowcase = () => {
  const navigate = useNavigate();
  const { publicCharacters, loading } = useCharacterShowcase();
  const [search, setSearch] = useState("");

  const filteredCharacters = publicCharacters.filter(char =>
    char.name.toLowerCase().includes(search.toLowerCase()) ||
    char.race?.name?.toLowerCase().includes(search.toLowerCase()) ||
    char.owner?.username?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort by level, then XP
  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  const topCharacters = sortedCharacters.slice(0, 3);
  const otherCharacters = sortedCharacters.slice(3);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-t-lg" />
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded" />
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
          <Users className="h-6 w-6 text-primary" />
          Character Showcase
        </h2>
        <p className="text-muted-foreground">
          Discover legendary heroes created by the community
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search characters, races, or creators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {publicCharacters.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Public Characters Yet</h3>
            <p className="text-muted-foreground">
              Be the first to showcase your character by making it public!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top Characters (Leaderboard) */}
          {topCharacters.length > 0 && !search && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Hall of Fame
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {topCharacters.map((char, index) => (
                  <TopCharacterCard key={char.id} character={char} rank={index + 1} />
                ))}
              </div>
            </div>
          )}

          {/* All Characters Grid */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              {search ? `Results for "${search}"` : "All Heroes"}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({filteredCharacters.length} characters)
              </span>
            </h3>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(search ? sortedCharacters : otherCharacters).map((char, index) => (
                <CharacterCard key={char.id} character={char} index={index} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TopCharacterCard = ({ character, rank }: { character: ShowcaseCharacter; rank: number }) => {
  const navigate = useNavigate();
  
  const rankColors = {
    1: "from-yellow-500/20 to-amber-500/20 border-yellow-500/40",
    2: "from-gray-400/20 to-slate-400/20 border-gray-400/40",
    3: "from-amber-700/20 to-orange-700/20 border-amber-700/40"
  };

  const rankIcons = {
    1: "🥇",
    2: "🥈",
    3: "🥉"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card 
        className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br ${rankColors[rank as 1|2|3] || ""}`}
        onClick={() => navigate(`/lore-chronicles/character/${character.id}`)}
      >
        <div className="absolute top-2 right-2 text-2xl">{rankIcons[rank as 1|2|3]}</div>
        
        <div className="h-24 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          {character.portrait_url ? (
            <img src={character.portrait_url} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <Avatar className="h-16 w-16 border-2 border-background">
              <AvatarFallback className="text-xl">{character.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{character.name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {character.race?.name || "Unknown Race"}
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Lv. {character.level}
            </Badge>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage src={character.owner?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {character.owner?.username?.slice(0, 1).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span>{character.owner?.username || "Unknown"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CharacterCard = ({ character, index }: { character: ShowcaseCharacter; index: number }) => {
  const navigate = useNavigate();
  const totalStats = Object.values(character.stats).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card 
        className="overflow-hidden cursor-pointer hover:border-primary/40 transition-colors group"
        onClick={() => navigate(`/lore-chronicles/character/${character.id}`)}
      >
        <div className="h-20 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
          {character.portrait_url ? (
            <img src={character.portrait_url} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarFallback>{character.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-sm line-clamp-1">{character.name}</h4>
              <p className="text-xs text-muted-foreground">{character.race?.name || "Unknown"}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              Lv. {character.level}
            </Badge>
          </div>

          {/* Mini stat preview */}
          <div className="flex gap-1 mb-2">
            {Object.entries(character.stats).slice(0, 3).map(([stat, value]) => (
              <div key={stat} className="text-xs flex items-center gap-0.5" title={stat}>
                <span>{statIcons[stat]}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-4 w-4">
              <AvatarImage src={character.owner?.avatar_url || undefined} />
              <AvatarFallback className="text-[8px]">
                {character.owner?.username?.slice(0, 1).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{character.owner?.username || "Unknown"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
