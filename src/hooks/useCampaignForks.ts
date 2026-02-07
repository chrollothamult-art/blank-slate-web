import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CampaignFork {
  id: string;
  source_campaign_id: string;
  target_campaign_id: string;
  fork_node_id: string | null;
  entry_node_id: string | null;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  source_campaign?: {
    title: string;
    author_id: string;
  };
  target_campaign?: {
    title: string;
    author_id: string;
  };
}

// Helper to run raw SQL through the REST API  
const runQuery = async (query: string): Promise<CampaignFork[]> => {
  try {
    const { data, error } = await supabase.rpc('run_sql' as never, { query } as never);
    if (error) throw error;
    return (data as CampaignFork[]) || [];
  } catch {
    // Table might not exist yet
    return [];
  }
};

export const useCampaignForks = (campaignId?: string) => {
  const { user } = useAuth();
  const [forks, setForks] = useState<CampaignFork[]>([]);
  const [incomingForks, setIncomingForks] = useState<CampaignFork[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch forks where this campaign is the source (outgoing crossovers)
  const fetchOutgoingForks = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript check for new table
      const { data, error } = await (supabase as any)
        .from("rp_campaign_forks")
        .select(`
          *,
          target_campaign:rp_campaigns!target_campaign_id(title, author_id)
        `)
        .eq("source_campaign_id", campaignId)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching outgoing forks:", error);
        setLoading(false);
        return;
      }

      setForks((data || []) as CampaignFork[]);
    } catch (err) {
      console.error("Error fetching outgoing forks:", err);
    }
    setLoading(false);
  }, [campaignId]);

  // Fetch forks where this campaign is the target (incoming crossovers)
  const fetchIncomingForks = useCallback(async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await (supabase as any)
        .from("rp_campaign_forks")
        .select(`
          *,
          source_campaign:rp_campaigns!source_campaign_id(title, author_id)
        `)
        .eq("target_campaign_id", campaignId)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching incoming forks:", error);
        return;
      }

      setIncomingForks((data || []) as CampaignFork[]);
    } catch (err) {
      console.error("Error fetching incoming forks:", err);
    }
  }, [campaignId]);

  // Create a new campaign fork (crossover)
  const createFork = async (forkData: {
    source_campaign_id: string;
    target_campaign_id: string;
    fork_node_id?: string;
    entry_node_id?: string;
    title: string;
    description?: string;
  }) => {
    if (!user) {
      toast({ title: "Please sign in to create crossovers", variant: "destructive" });
      return null;
    }

    try {
      const { data: fork, error } = await (supabase as any)
        .from("rp_campaign_forks")
        .insert({
          source_campaign_id: forkData.source_campaign_id,
          target_campaign_id: forkData.target_campaign_id,
          fork_node_id: forkData.fork_node_id || null,
          entry_node_id: forkData.entry_node_id || null,
          title: forkData.title,
          description: forkData.description || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Failed to create crossover", description: error.message, variant: "destructive" });
        return null;
      }

      toast({ 
        title: "Crossover created!", 
        description: "Players can now travel between campaigns." 
      });

      await fetchOutgoingForks();
      return fork as CampaignFork;
    } catch (err) {
      toast({ title: "Failed to create crossover", variant: "destructive" });
      return null;
    }
  };

  // Update a fork
  const updateFork = async (
    forkId: string,
    updates: Partial<Pick<CampaignFork, "title" | "description" | "fork_node_id" | "entry_node_id" | "is_active">>
  ) => {
    try {
      const { error } = await (supabase as any)
        .from("rp_campaign_forks")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", forkId);

      if (error) {
        toast({ title: "Failed to update crossover", description: error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Crossover updated" });
      await fetchOutgoingForks();
      return true;
    } catch (err) {
      toast({ title: "Failed to update crossover", variant: "destructive" });
      return false;
    }
  };

  // Delete a fork
  const deleteFork = async (forkId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("rp_campaign_forks")
        .delete()
        .eq("id", forkId);

      if (error) {
        toast({ title: "Failed to delete crossover", description: error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Crossover removed" });
      await fetchOutgoingForks();
      return true;
    } catch (err) {
      toast({ title: "Failed to delete crossover", variant: "destructive" });
      return false;
    }
  };

  // Get all available crossovers from a specific node
  const getNodeCrossovers = async (nodeId: string): Promise<CampaignFork[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from("rp_campaign_forks")
        .select(`
          *,
          target_campaign:rp_campaigns!target_campaign_id(title, description, cover_image_url)
        `)
        .eq("fork_node_id", nodeId)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching node crossovers:", error);
        return [];
      }

      return (data || []) as CampaignFork[];
    } catch (err) {
      console.error("Error fetching node crossovers:", err);
      return [];
    }
  };

  return {
    forks,
    incomingForks,
    loading,
    createFork,
    updateFork,
    deleteFork,
    getNodeCrossovers,
    fetchOutgoingForks,
    fetchIncomingForks
  };
};
