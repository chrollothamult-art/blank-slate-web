import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Scale, User, Plus, X, Swords, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Character {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  role: string | null;
  affiliation: string | null;
  era: string | null;
  species: string | null;
  abilities: string | null;
  relationships: string | null;
}

interface CharacterStats {
  strength: number;
  intelligence: number;
  agility: number;
  magic: number;
  charisma: number;
  endurance: number;
}

interface CharacterWithStats extends Character {
  stats?: CharacterStats;
}

// Generate stats from character data for demo purposes (fallback when no stats in DB)
const generateStats = (character: Character): CharacterStats => {
  const hash = character.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    strength: 40 + (hash % 60),
    intelligence: 30 + ((hash * 2) % 70),
    agility: 35 + ((hash * 3) % 65),
    magic: character.abilities?.toLowerCase().includes("magic") ? 70 + (hash % 30) : 20 + (hash % 40),
    charisma: 45 + ((hash * 4) % 55),
    endurance: 50 + ((hash * 5) % 50),
  };
};

const statIcons: Record<string, React.ReactNode> = {
  strength: <Swords className="h-4 w-4" />,
  intelligence: <Sparkles className="h-4 w-4" />,
  agility: <Sparkles className="h-4 w-4" />,
  magic: <Sparkles className="h-4 w-4" />,
  charisma: <User className="h-4 w-4" />,
  endurance: <Shield className="h-4 w-4" />,
};

const StatBar = ({ 
  label, 
  value, 
  compareValue, 
  color 
}: { 
  label: string; 
  value: number; 
  compareValue?: number; 
  color: string;
}) => {
  const isHigher = compareValue !== undefined && value > compareValue;
  const isLower = compareValue !== undefined && value < compareValue;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 capitalize text-[hsl(var(--parchment-brown))]">
          {statIcons[label]}
          {label}
        </span>
        <span className={`font-bold ${isHigher ? "text-green-600" : isLower ? "text-red-500" : ""}`}>
          {value}
          {isHigher && " ▲"}
          {isLower && " ▼"}
        </span>
      </div>
      <div className="h-2 bg-[hsl(var(--parchment-border))] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const CharacterCard = ({
  character,
  stats,
  compareStats,
  onRemove,
  color,
}: {
  character: Character;
  stats: CharacterStats;
  compareStats?: CharacterStats;
  onRemove: () => void;
  color: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-1"
    >
      <Card className="h-full bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {character.image_url ? (
                <img
                  src={character.image_url}
                  alt={character.name}
                  className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: color }}
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-2xl font-bold text-white">
                    {character.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <CardTitle className="text-lg text-[hsl(var(--parchment-brown))]">
                  {character.name}
                </CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  {character.role && (
                    <Badge variant="outline" className="text-xs">
                      {character.role}
                    </Badge>
                  )}
                  {character.era && (
                    <Badge variant="secondary" className="text-xs">
                      {character.era}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {Object.entries(stats).map(([key, value]) => (
              <StatBar
                key={key}
                label={key}
                value={value}
                compareValue={compareStats?.[key as keyof CharacterStats]}
                color={color}
              />
            ))}
          </div>

          <div className="pt-4 border-t border-[hsl(var(--parchment-border))] space-y-2">
            {character.species && (
              <div className="text-sm">
                <span className="text-[hsl(var(--parchment-muted))]">Species: </span>
                <span className="text-[hsl(var(--parchment-brown))]">{character.species}</span>
              </div>
            )}
            {character.affiliation && (
              <div className="text-sm">
                <span className="text-[hsl(var(--parchment-muted))]">Affiliation: </span>
                <span className="text-[hsl(var(--parchment-brown))]">{character.affiliation}</span>
              </div>
            )}
            {character.abilities && (
              <div className="text-sm">
                <span className="text-[hsl(var(--parchment-muted))]">Abilities: </span>
                <span className="text-[hsl(var(--parchment-brown))]">
                  {character.abilities.length > 100 
                    ? character.abilities.slice(0, 100) + "..." 
                    : character.abilities}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const CharacterComparison = () => {
  const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    
    // Fetch characters
    const { data: charsData, error: charsError } = await supabase
      .from("almanac_characters")
      .select("*")
      .order("name");

    if (charsError) {
      console.error("Error fetching characters:", charsError);
      setLoading(false);
      return;
    }

    // Fetch stats for all characters
    const { data: statsData, error: statsError } = await supabase
      .from("character_stats")
      .select("*");

    if (statsError) {
      console.error("Error fetching stats:", statsError);
    }

    // Merge stats with characters
    const charactersWithStats = (charsData || []).map(char => {
      const charStats = statsData?.find(s => s.character_id === char.id);
      return {
        ...char,
        stats: charStats ? {
          strength: charStats.strength ?? 50,
          intelligence: charStats.intelligence ?? 50,
          agility: charStats.agility ?? 50,
          magic: charStats.magic ?? 50,
          charisma: charStats.charisma ?? 50,
          endurance: charStats.endurance ?? 50,
        } : undefined
      } as CharacterWithStats;
    });

    setCharacters(charactersWithStats);
    setLoading(false);
  };

  const selectedCharacters = characters.filter(c => selectedIds.includes(c.id));
  const availableCharacters = characters.filter(c => !selectedIds.includes(c.id));

  const handleAddCharacter = (id: string) => {
    if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemoveCharacter = (id: string) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  // Helper to get stats (from DB or generated fallback)
  const getCharacterStats = (char: CharacterWithStats): CharacterStats => {
    return char.stats || generateStats(char);
  };

  const colors = ["hsl(45, 93%, 47%)", "hsl(173, 80%, 40%)", "hsl(262, 83%, 58%)"];

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <Scale className="h-5 w-5" />
            Character Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
          <Scale className="h-5 w-5" />
          Character Comparison
        </CardTitle>
        <p className="text-sm text-[hsl(var(--parchment-muted))]">
          Compare up to 3 characters side by side
        </p>
      </CardHeader>
      <CardContent>
        {/* Character Selector */}
        <div className="flex items-center gap-4 mb-6">
          <Select
            value=""
            onValueChange={handleAddCharacter}
            disabled={selectedIds.length >= 3}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Add a character to compare" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {availableCharacters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    <div className="flex items-center gap-2">
                      {char.image_url ? (
                        <img
                          src={char.image_url}
                          alt={char.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--parchment-gold))] flex items-center justify-center">
                          <span className="text-xs font-bold">{char.name.charAt(0)}</span>
                        </div>
                      )}
                      {char.name}
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          <span className="text-sm text-[hsl(var(--parchment-muted))]">
            {selectedIds.length}/3 selected
          </span>
        </div>

        {/* Comparison Grid */}
        {selectedCharacters.length === 0 ? (
          <div className="text-center py-12 bg-[hsl(var(--parchment-bg))] rounded-lg border border-[hsl(var(--parchment-border))]">
            <Scale className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--parchment-muted))]" />
            <p className="text-[hsl(var(--parchment-muted))] mb-4">
              Select characters above to compare their stats
            </p>
            {characters.length === 0 && (
              <p className="text-sm text-[hsl(var(--parchment-muted))]">
                No characters available. Add characters in the admin panel first.
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-4">
            <AnimatePresence mode="popLayout">
              {selectedCharacters.map((char, index) => {
                const stats = getCharacterStats(char);
                const compareStats = selectedCharacters.length === 2 && index === 0
                  ? getCharacterStats(selectedCharacters[1])
                  : selectedCharacters.length === 2 && index === 1
                  ? getCharacterStats(selectedCharacters[0])
                  : undefined;

                return (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    stats={stats}
                    compareStats={compareStats}
                    onRemove={() => handleRemoveCharacter(char.id)}
                    color={colors[index]}
                  />
                );
              })}
            </AnimatePresence>

            {/* Add more slot */}
            {selectedCharacters.length < 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-[200px]"
              >
                <div 
                  className="h-full min-h-[400px] border-2 border-dashed border-[hsl(var(--parchment-border))] rounded-xl flex items-center justify-center cursor-pointer hover:border-[hsl(var(--parchment-gold))] transition-colors"
                  onClick={() => {
                    const select = document.querySelector('[data-radix-collection-item]');
                    if (select) (select as HTMLElement).click();
                  }}
                >
                  <div className="text-center">
                    <Plus className="h-12 w-12 mx-auto mb-2 text-[hsl(var(--parchment-muted))]" />
                    <p className="text-sm text-[hsl(var(--parchment-muted))]">
                      Add character
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
