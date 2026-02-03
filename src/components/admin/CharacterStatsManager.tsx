import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Save, User } from "lucide-react";

interface Character {
  id: string;
  name: string;
  image_url: string | null;
}

interface CharacterStats {
  id?: string;
  character_id: string;
  strength: number;
  intelligence: number;
  agility: number;
  magic: number;
  charisma: number;
  endurance: number;
}

const statLabels = ["strength", "intelligence", "agility", "magic", "charisma", "endurance"];

export const CharacterStatsManager = () => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (selectedCharacterId) {
      fetchStats(selectedCharacterId);
    } else {
      setStats(null);
    }
  }, [selectedCharacterId]);

  const fetchCharacters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("almanac_characters")
      .select("id, name, image_url")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch characters",
        variant: "destructive",
      });
    } else {
      setCharacters((data || []) as Character[]);
    }
    setLoading(false);
  };

  const fetchStats = async (characterId: string) => {
    const { data, error } = await supabase
      .from("character_stats")
      .select("*")
      .eq("character_id", characterId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching stats:", error);
    }

    if (data) {
      setStats(data as CharacterStats);
    } else {
      // Initialize with default stats
      setStats({
        character_id: characterId,
        strength: 50,
        intelligence: 50,
        agility: 50,
        magic: 50,
        charisma: 50,
        endurance: 50,
      });
    }
  };

  const handleStatChange = (stat: string, value: number) => {
    if (stats) {
      setStats({ ...stats, [stat]: value });
    }
  };

  const handleSave = async () => {
    if (!stats || !selectedCharacterId) return;

    setSaving(true);

    const statsData = {
      character_id: selectedCharacterId,
      strength: stats.strength,
      intelligence: stats.intelligence,
      agility: stats.agility,
      magic: stats.magic,
      charisma: stats.charisma,
      endurance: stats.endurance,
    };

    if (stats.id) {
      const { error } = await supabase
        .from("character_stats")
        .update(statsData)
        .eq("id", stats.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update stats",
          variant: "destructive",
        });
      } else {
        toast({ title: "Stats updated successfully" });
      }
    } else {
      const { data, error } = await supabase
        .from("character_stats")
        .insert([statsData])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save stats",
          variant: "destructive",
        });
      } else {
        setStats(data as CharacterStats);
        toast({ title: "Stats saved successfully" });
      }
    }

    setSaving(false);
  };

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Character Stats Manager
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure stats for character comparison feature
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Character Selector */}
          <div className="space-y-2">
            <Label>Select Character</Label>
            <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Choose a character" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id}>
                      <div className="flex items-center gap-2">
                        {char.image_url ? (
                          <img
                            src={char.image_url}
                            alt={char.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                        {char.name}
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Editor */}
          {selectedCharacterId && stats ? (
            <div className="space-y-6">
              {selectedCharacter && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  {selectedCharacter.image_url ? (
                    <img
                      src={selectedCharacter.image_url}
                      alt={selectedCharacter.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{selectedCharacter.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.id ? "Editing existing stats" : "Creating new stats"}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-6">
                {statLabels.map((stat) => (
                  <div key={stat} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="capitalize">{stat}</Label>
                      <span className="text-sm font-medium">
                        {stats[stat as keyof CharacterStats] as number}
                      </span>
                    </div>
                    <Slider
                      value={[stats[stat as keyof CharacterStats] as number]}
                      onValueChange={([value]) => handleStatChange(stat, value)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Stats"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? "Loading characters..." : "Select a character to edit their stats"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
