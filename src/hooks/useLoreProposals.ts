import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ProposalCategory = "race" | "location" | "item" | "faction" | "ability" | "concept";
export type ProposalStatus = "pending" | "approved" | "rejected";

export interface LoreProposalContent {
  name: string;
  description: string;
  details?: string;
  image_url?: string;
  // Category-specific fields
  homeland?: string; // for races
  location_type?: string; // for locations
  item_type?: string; // for items
  rarity?: string; // for items, abilities
  effect?: string; // for items, abilities
  faction_type?: string; // for factions
}

export interface LoreProposal {
  id: string;
  user_id: string;
  title: string;
  category: ProposalCategory;
  content: LoreProposalContent;
  status: ProposalStatus;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url: string | null;
  };
  reviewer?: {
    username: string;
  };
}

export const useLoreProposals = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<LoreProposal[]>([]);
  const [myProposals, setMyProposals] = useState<LoreProposal[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoremaster, setIsLoremaster] = useState(false);

  // Check if current user is a Loremaster
  const checkLoremasterStatus = useCallback(async () => {
    if (!user) {
      setIsLoremaster(false);
      return;
    }

    const { data, error } = await supabase
      .from("rp_loremasters")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking loremaster status:", error);
    }

    setIsLoremaster(!!data);
  }, [user]);

  // Fetch all pending proposals (for loremasters)
  const fetchPendingProposals = useCallback(async () => {
    // First fetch proposals
    const { data: proposalsData, error: proposalsError } = await supabase
      .from("rp_lore_proposals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (proposalsError) {
      console.error("Error fetching pending proposals:", proposalsError);
      return;
    }

    // Then fetch user info separately
    const userIds = [...new Set((proposalsData || []).map(p => p.user_id))];
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const usersMap = new Map(
      (usersData || []).map(u => [u.id, { username: u.username, avatar_url: u.avatar_url }])
    );

    const mapped: LoreProposal[] = (proposalsData || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      category: p.category as ProposalCategory,
      content: p.content as unknown as LoreProposalContent,
      status: p.status as ProposalStatus,
      reviewer_id: p.reviewer_id,
      reviewer_notes: p.reviewer_notes,
      reviewed_at: p.reviewed_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
      user: usersMap.get(p.user_id)
    }));

    setProposals(mapped);
    setPendingCount(mapped.length);
  }, []);

  // Fetch user's own proposals
  const fetchMyProposals = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("rp_lore_proposals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching my proposals:", error);
      return;
    }

    const mapped: LoreProposal[] = (data || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      category: p.category as ProposalCategory,
      content: p.content as unknown as LoreProposalContent,
      status: p.status as ProposalStatus,
      reviewer_id: p.reviewer_id,
      reviewer_notes: p.reviewer_notes,
      reviewed_at: p.reviewed_at,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    setMyProposals(mapped);
  }, [user]);

  // Create a new lore proposal
  const createProposal = async (
    title: string,
    category: ProposalCategory,
    content: LoreProposalContent
  ) => {
    if (!user) {
      toast({ title: "Please sign in to submit proposals", variant: "destructive" });
      return null;
    }

    const { data, error } = await supabase
      .from("rp_lore_proposals")
      .insert([{
        user_id: user.id,
        title,
        category,
        content: JSON.parse(JSON.stringify(content)),
        status: "pending" as const
      }])
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to submit proposal", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ 
      title: "Proposal submitted!", 
      description: "A Loremaster will review your submission." 
    });
    
    await fetchMyProposals();
    return data;
  };

  // Review a proposal (approve/reject) - Loremaster only
  const reviewProposal = async (
    proposalId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    if (!user || !isLoremaster) {
      toast({ title: "Unauthorized", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from("rp_lore_proposals")
      .update({
        status,
        reviewer_id: user.id,
        reviewer_notes: notes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", proposalId);

    if (error) {
      toast({ title: "Failed to review proposal", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ 
      title: status === "approved" ? "Proposal approved!" : "Proposal rejected",
      description: status === "approved" 
        ? "The lore has been added to the universe." 
        : "The submitter will be notified."
    });

    await fetchPendingProposals();
    return true;
  };

  // Delete a proposal (owner only)
  const deleteProposal = async (proposalId: string) => {
    const { error } = await supabase
      .from("rp_lore_proposals")
      .delete()
      .eq("id", proposalId);

    if (error) {
      toast({ title: "Failed to delete proposal", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Proposal deleted" });
    await fetchMyProposals();
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await checkLoremasterStatus();
      await fetchMyProposals();
      setLoading(false);
    };

    loadData();
  }, [checkLoremasterStatus, fetchMyProposals]);

  // Re-fetch when loremaster status changes
  useEffect(() => {
    if (isLoremaster) {
      fetchPendingProposals();
    }
  }, [isLoremaster, fetchPendingProposals]);

  return {
    proposals,
    myProposals,
    pendingCount,
    loading,
    isLoremaster,
    createProposal,
    reviewProposal,
    deleteProposal,
    refetchProposals: fetchPendingProposals,
    refetchMyProposals: fetchMyProposals
  };
};
