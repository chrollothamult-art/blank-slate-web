import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CharacterStats } from "@/hooks/useLoreChronicles";

export interface ShowcaseCharacter {
  id: string;
  user_id: string;
  name: string;
  race_id: string | null;
  stats: CharacterStats;
  backstory: string | null;
  portrait_url: string | null;
  level: number;
  xp: number;
  is_public: boolean;
  created_at: string;
  race?: {
    id: string;
    name: string;
    image_url: string | null;
  };
  owner?: {
    username: string;
    avatar_url: string | null;
  };
}

const DEFAULT_STATS: CharacterStats = {
  strength: 3,
  magic: 3,
  charisma: 3,
  wisdom: 3,
  agility: 3
};

export const useCharacterShowcase = () => {
  const { user } = useAuth();
  const [publicCharacters, setPublicCharacters] = useState<ShowcaseCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublicCharacters = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("rp_characters")
      .select(`
        *,
        race:almanac_races(id, name, image_url)
      `)
      .eq("is_public", true)
      .order("level", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching public characters:", error);
      setLoading(false);
      return;
    }

    // Fetch owner profiles separately
    const userIds = [...new Set((data || []).map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const mappedCharacters: ShowcaseCharacter[] = (data || []).map((c) => {
      const rawStats = c.stats as unknown;
      const stats: CharacterStats = 
        rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)
          ? { ...DEFAULT_STATS, ...(rawStats as Record<string, number>) }
          : DEFAULT_STATS;
      
      const profile = profileMap.get(c.user_id);
      
      return {
        id: c.id,
        user_id: c.user_id,
        name: c.name,
        race_id: c.race_id,
        stats,
        backstory: c.backstory,
        portrait_url: c.portrait_url,
        level: c.level,
        xp: c.xp,
        is_public: (c as { is_public?: boolean }).is_public ?? false,
        created_at: c.created_at,
        race: c.race as ShowcaseCharacter["race"],
        owner: profile ? { username: profile.username, avatar_url: profile.avatar_url } : undefined
      };
    });

    setPublicCharacters(mappedCharacters);
    setLoading(false);
  }, []);

  const toggleCharacterVisibility = async (characterId: string, isPublic: boolean) => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from("rp_characters")
      .update({ is_public: isPublic })
      .eq("id", characterId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Failed to update visibility", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ 
      title: isPublic ? "Character is now public!" : "Character is now private",
      description: isPublic ? "Others can now view your character in the showcase" : "Only you can see this character"
    });
    
    return true;
  };

  useEffect(() => {
    fetchPublicCharacters();
  }, [fetchPublicCharacters]);

  return {
    publicCharacters,
    loading,
    toggleCharacterVisibility,
    refetch: fetchPublicCharacters
  };
};
