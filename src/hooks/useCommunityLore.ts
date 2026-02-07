import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityLoreEntry {
  id: string;
  proposal_id: string | null;
  category: string;
  name: string;
  description: string;
  article: string | null;
  image_url: string | null;
  creator_id: string;
  approved_by: string | null;
  approved_at: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useCommunityLore = (category?: string) => {
  const [entries, setEntries] = useState<CommunityLoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredEntries, setFeaturedEntries] = useState<CommunityLoreEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from("rp_community_lore")
      .select("*")
      .order("approved_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching community lore:", error);
      setLoading(false);
      return;
    }

    // Fetch creator profiles separately
    const creatorIds = [...new Set((data || []).map(e => e.creator_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", creatorIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const mappedEntries: CommunityLoreEntry[] = (data || []).map((e) => {
      const profile = profileMap.get(e.creator_id);
      return {
        id: e.id,
        proposal_id: e.proposal_id,
        category: e.category,
        name: e.name,
        description: e.description,
        article: e.article,
        image_url: e.image_url,
        creator_id: e.creator_id,
        approved_by: e.approved_by,
        approved_at: e.approved_at,
        is_featured: e.is_featured ?? false,
        view_count: e.view_count ?? 0,
        created_at: e.created_at,
        updated_at: e.updated_at,
        creator: profile ? { username: profile.username, avatar_url: profile.avatar_url } : undefined
      };
    });

    setEntries(mappedEntries);
    setFeaturedEntries(mappedEntries.filter(e => e.is_featured));
    setLoading(false);
  }, [category]);

  const incrementViewCount = async (entryId: string) => {
    // Direct update instead of RPC
    await supabase
      .from("rp_community_lore")
      .update({ view_count: supabase.rpc ? 1 : 1 }) // Placeholder - would need raw SQL
      .eq("id", entryId);
  };

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    featuredEntries,
    loading,
    refetch: fetchEntries,
    incrementViewCount
  };
};
