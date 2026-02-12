 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "@/hooks/use-toast";
 
 export interface CharacterStats {
   strength: number;
   magic: number;
   charisma: number;
   wisdom: number;
   agility: number;
 }
 
 export interface RpCharacter {
   id: string;
   user_id: string;
   name: string;
   race_id: string | null;
   stats: CharacterStats;
   backstory: string | null;
   portrait_url: string | null;
   level: number;
   xp: number;
   is_active: boolean;
   current_session_id: string | null;
   created_at: string;
   updated_at: string;
   race?: {
     id: string;
     name: string;
     image_url: string | null;
     description: string;
   };
 }
 
export interface RpCampaign {
    id: string;
    author_id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    genre: string;
    difficulty: string;
    is_published: boolean;
    is_featured: boolean;
    start_node_id: string | null;
    estimated_duration: number | null;
    play_count: number;
    permadeath: boolean;
    created_at: string;
    updated_at: string;
    author?: {
      username: string;
      avatar_url: string | null;
    };
  }
 
 export interface RpSession {
   id: string;
   campaign_id: string;
   created_by: string;
   mode: string;
   status: string;
   current_node_id: string | null;
   story_flags: Record<string, unknown>;
   started_at: string;
   last_played_at: string;
   completed_at: string | null;
   campaign?: RpCampaign;
 }
 
export interface RpStoryNode {
  id: string;
  campaign_id: string;
  node_type: string;
  title: string | null;
  content: {
    text?: string;
    npc_portrait?: string;
    npc_name?: string;
    backdrop_url?: string;
    npc_voice_url?: string;
    weather?: "rain" | "snow" | "fog" | "none";
    time_of_day?: "dawn" | "day" | "dusk" | "night";
  };
  position_x: number;
  position_y: number;
  image_url: string | null;
  audio_url: string | null;
  xp_reward: number;
  allows_free_text: boolean;
  free_text_prompt: string | null;
  created_at: string;
  updated_at: string;
}
 
 export interface RpNodeChoice {
   id: string;
   node_id: string;
   choice_text: string;
   target_node_id: string | null;
   stat_requirement: { stat: string; min_value: number } | null;
   stat_effect: Record<string, unknown> | null;
   item_requirement: string | null;
   item_reward: string | null;
   order_index: number;
 }
 
 const DEFAULT_STATS: CharacterStats = {
   strength: 3,
   magic: 3,
   charisma: 3,
   wisdom: 3,
   agility: 3
 };
 
 export const useLoreChronicles = () => {
   const { user } = useAuth();
  const [characters, setCharacters] = useState<RpCharacter[]>([]);
    const [campaigns, setCampaigns] = useState<RpCampaign[]>([]);
    const [draftCampaigns, setDraftCampaigns] = useState<RpCampaign[]>([]);
    const [sessions, setSessions] = useState<RpSession[]>([]);
    const [loading, setLoading] = useState(true);
 
   const fetchCharacters = useCallback(async () => {
     if (!user) return;
     
     const { data, error } = await supabase
       .from("rp_characters")
       .select(`
         *,
         race:almanac_races(id, name, image_url, description)
       `)
       .eq("user_id", user.id)
       .order("created_at", { ascending: false });
 
     if (error) {
       console.error("Error fetching characters:", error);
       return;
     }
 
     const mappedCharacters: RpCharacter[] = (data || []).map((c) => {
       const rawStats = c.stats as unknown;
       const stats: CharacterStats = 
         rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)
           ? { ...DEFAULT_STATS, ...(rawStats as Record<string, number>) }
           : DEFAULT_STATS;
       
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
         is_active: c.is_active,
         current_session_id: c.current_session_id,
         created_at: c.created_at,
         updated_at: c.updated_at,
         race: c.race as RpCharacter["race"]
       };
     });
 
     setCharacters(mappedCharacters);
   }, [user]);
 
    const fetchCampaigns = useCallback(async () => {
      const { data, error } = await supabase
        .from("rp_campaigns")
        .select("*")
        .eq("is_published", true)
        .order("play_count", { ascending: false });
  
      if (error) {
        console.error("Error fetching campaigns:", error);
        return;
      }
  
       const mapCampaign = (c: any): RpCampaign => ({
         id: c.id,
         author_id: c.author_id,
         title: c.title,
         description: c.description,
         cover_image_url: c.cover_image_url,
         genre: c.genre,
         difficulty: c.difficulty,
         is_published: c.is_published,
         is_featured: c.is_featured,
         start_node_id: c.start_node_id,
         estimated_duration: c.estimated_duration,
         play_count: c.play_count,
         permadeath: c.permadeath,
         created_at: c.created_at,
         updated_at: c.updated_at
       });

       setCampaigns((data || []).map(mapCampaign));
    }, []);

    const fetchDraftCampaigns = useCallback(async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("rp_campaigns")
        .select("*")
        .eq("author_id", user.id)
        .eq("is_published", false)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching draft campaigns:", error);
        return;
      }

      const mapCampaign = (c: any): RpCampaign => ({
        id: c.id,
        author_id: c.author_id,
        title: c.title,
        description: c.description,
        cover_image_url: c.cover_image_url,
        genre: c.genre,
        difficulty: c.difficulty,
        is_published: c.is_published,
        is_featured: c.is_featured,
        start_node_id: c.start_node_id,
        estimated_duration: c.estimated_duration,
        play_count: c.play_count,
        permadeath: c.permadeath,
        created_at: c.created_at,
        updated_at: c.updated_at
      });

      setDraftCampaigns((data || []).map(mapCampaign));
    }, [user]);
 
   const fetchSessions = useCallback(async () => {
     if (!user) return;
 
     const { data, error } = await supabase
       .from("rp_sessions")
       .select(`
         *,
         campaign:rp_campaigns(*)
       `)
       .eq("created_by", user.id)
       .order("last_played_at", { ascending: false });
 
     if (error) {
       console.error("Error fetching sessions:", error);
       return;
     }
 
     const mappedSessions: RpSession[] = (data || []).map((s) => {
       const rawFlags = s.story_flags as unknown;
       const storyFlags: Record<string, unknown> = 
         rawFlags && typeof rawFlags === 'object' && !Array.isArray(rawFlags)
           ? rawFlags as Record<string, unknown>
           : {};
       
       const rawCampaign = s.campaign as unknown;
       
       return {
         id: s.id,
         campaign_id: s.campaign_id,
         created_by: s.created_by,
         mode: s.mode,
         status: s.status,
         current_node_id: s.current_node_id,
         story_flags: storyFlags,
         started_at: s.started_at,
         last_played_at: s.last_played_at,
         completed_at: s.completed_at,
         campaign: rawCampaign as RpCampaign | undefined
       };
     });
 
     setSessions(mappedSessions);
   }, [user]);
 
   const createCharacter = async (characterData: {
     name: string;
     race_id: string | null;
     stats: CharacterStats;
     backstory: string | null;
     portrait_url: string | null;
   }) => {
     if (!user) {
       toast({ title: "Please sign in to create a character", variant: "destructive" });
       return null;
     }
 
     const { data, error } = await supabase
       .from("rp_characters")
     .insert([{
         user_id: user.id,
         name: characterData.name,
         race_id: characterData.race_id,
       stats: characterData.stats as unknown as Record<string, number>,
         backstory: characterData.backstory,
         portrait_url: characterData.portrait_url
     }])
       .select()
       .single();
 
     if (error) {
       toast({ title: "Failed to create character", description: error.message, variant: "destructive" });
       return null;
     }
 
     toast({ title: "Character created!", description: `${characterData.name} is ready for adventure.` });
     await fetchCharacters();
     return data;
   };
 
    const createCampaign = async (campaignData: {
      title: string;
      description: string | null;
      genre: string;
      difficulty: string;
      cover_image_url: string | null;
      permadeath?: boolean;
    }) => {
      if (!user) {
        toast({ title: "Please sign in to create a campaign", variant: "destructive" });
        return null;
      }
  
      const { data, error } = await supabase
        .from("rp_campaigns")
        .insert({
          author_id: user.id,
          title: campaignData.title,
          description: campaignData.description,
          genre: campaignData.genre,
          difficulty: campaignData.difficulty,
          cover_image_url: campaignData.cover_image_url,
          permadeath: campaignData.permadeath || false
        })
        .select()
        .single();
 
     if (error) {
       toast({ title: "Failed to create campaign", description: error.message, variant: "destructive" });
       return null;
     }
 
     toast({ title: "Campaign created!", description: "Start building your story." });
     return data;
   };
 
   const startSession = async (campaignId: string, characterId: string) => {
     if (!user) {
       toast({ title: "Please sign in to play", variant: "destructive" });
       return null;
     }
 
     const { data: campaign } = await supabase
       .from("rp_campaigns")
       .select("start_node_id")
       .eq("id", campaignId)
       .single();
 
     const { data: session, error } = await supabase
       .from("rp_sessions")
       .insert({
         campaign_id: campaignId,
         created_by: user.id,
         current_node_id: campaign?.start_node_id,
         mode: "solo",
         status: "active"
       })
       .select()
       .single();
 
     if (error) {
       toast({ title: "Failed to start session", description: error.message, variant: "destructive" });
       return null;
     }
 
     await supabase.from("rp_session_participants").insert({
       session_id: session.id,
       character_id: characterId
     });
 
     const { data: character } = await supabase
       .from("rp_characters")
       .select("stats")
       .eq("id", characterId)
       .single();
 
     await supabase.from("rp_character_progress").insert({
       session_id: session.id,
       character_id: characterId,
       current_node_id: campaign?.start_node_id,
       stats_snapshot: character?.stats || {}
     });
 
     await fetchSessions();
     return session;
   };
 
  const deleteCharacter = async (characterId: string) => {
    const { error } = await supabase
      .from("rp_characters")
      .delete()
      .eq("id", characterId);

    if (error) {
      toast({ title: "Failed to delete character", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Character deleted" });
    await fetchCharacters();
    return true;
  };

  // Award XP to a character
  const awardXp = async (characterId: string, amount: number, reason?: string) => {
    if (!user) return false;

    // Get current character data
    const { data: character, error: fetchError } = await supabase
      .from("rp_characters")
      .select("xp, level, ability_slots")
      .eq("id", characterId)
      .single();

    if (fetchError || !character) {
      console.error("Error fetching character for XP award:", fetchError);
      return false;
    }

    const newXp = character.xp + amount;
    
    // Calculate new level based on XP thresholds
    // Level thresholds: 1=0, 2=100, 3=300, 4=600, 5=1000, 6=1500...
    const calculateLevel = (xp: number): number => {
      let level = 1;
      let threshold = 0;
      let increment = 100;
      
      while (xp >= threshold + increment) {
        threshold += increment;
        level++;
        increment += 100; // Each level requires 100 more XP than the last
      }
      
      return level;
    };

    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > character.level;

    // Update character
    const updateData: Record<string, unknown> = { 
      xp: newXp,
      level: newLevel,
    };

    // Grant additional ability slot every 2 levels
    if (leveledUp && newLevel % 2 === 0) {
      updateData.ability_slots = character.ability_slots + 1;
    }

    const { error: updateError } = await supabase
      .from("rp_characters")
      .update(updateData)
      .eq("id", characterId);

    if (updateError) {
      console.error("Error awarding XP:", updateError);
      return false;
    }

    // Show appropriate toast
    if (leveledUp) {
      toast({
        title: `Level Up! 🎉`,
        description: `You reached level ${newLevel}!${newLevel % 2 === 0 ? ' +1 ability slot!' : ''}`,
      });
    } else if (reason) {
      toast({
        title: `+${amount} XP`,
        description: reason,
      });
    }

    await fetchCharacters();
    return true;
  };

  // Update character stats
  const updateCharacterStats = async (
    characterId: string, 
    statChanges: Partial<CharacterStats>
  ) => {
    if (!user) return false;

    const { data: character, error: fetchError } = await supabase
      .from("rp_characters")
      .select("stats")
      .eq("id", characterId)
      .single();

    if (fetchError || !character) {
      console.error("Error fetching character stats:", fetchError);
      return false;
    }

    const currentStats = character.stats as unknown as CharacterStats;
    const newStats = { ...currentStats };

    for (const [stat, change] of Object.entries(statChanges)) {
      const statKey = stat as keyof CharacterStats;
      newStats[statKey] = Math.max(1, Math.min(10, (currentStats[statKey] || 3) + change));
    }

    const { error: updateError } = await supabase
      .from("rp_characters")
      .update({ stats: newStats as unknown as Record<string, number> })
      .eq("id", characterId);

    if (updateError) {
      console.error("Error updating stats:", updateError);
      return false;
    }

    // Show stat change toasts
    for (const [stat, change] of Object.entries(statChanges)) {
      if (change !== 0) {
        toast({
          title: `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${change > 0 ? '+' : ''}${change}`,
        });
      }
    }

    await fetchCharacters();
    return true;
  };
 
   useEffect(() => {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchCharacters(),
          fetchCampaigns(),
          fetchDraftCampaigns(),
          fetchSessions()
        ]);
        setLoading(false);
      };
  
      loadData();
    }, [fetchCharacters, fetchCampaigns, fetchDraftCampaigns, fetchSessions]);
  
   return {
     characters,
     campaigns,
     draftCampaigns,
     sessions,
     loading,
     createCharacter,
     createCampaign,
     startSession,
     deleteCharacter,
     awardXp,
     updateCharacterStats,
     refetchCharacters: fetchCharacters,
     refetchCampaigns: fetchCampaigns,
     refetchDraftCampaigns: fetchDraftCampaigns,
     refetchSessions: fetchSessions
   };
  };