import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ConvergenceType = "merge" | "clash" | "negotiate";
export type ConvergenceResult = "ally" | "enemy" | "neutral";

export interface EntryPoint {
  id: string;
  campaign_id: string;
  entry_label: string;
  start_node_id: string | null;
  faction_id: string | null;
  description: string | null;
  image_url: string | null;
  max_players: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface ConvergenceNode {
  id: string;
  campaign_id: string;
  node_id: string;
  name: string;
  convergence_type: ConvergenceType;
  required_entry_points: string[];
  description: string | null;
  created_at: string;
  rules?: ConvergenceRule[];
}

export interface ConvergenceRule {
  id: string;
  convergence_id: string;
  condition_type: string;
  conditions: Record<string, unknown>;
  result: ConvergenceResult;
  result_narrative: string | null;
  target_node_id: string | null;
  priority: number;
  created_at: string;
}

export const CONVERGENCE_TYPE_LABELS: Record<ConvergenceType, { label: string; description: string; icon: string }> = {
  merge: { label: "Merge", description: "Paths combine peacefully", icon: "🤝" },
  clash: { label: "Clash", description: "Paths collide in conflict", icon: "⚔️" },
  negotiate: { label: "Negotiate", description: "Paths meet to negotiate terms", icon: "🤔" },
};

export const RESULT_LABELS: Record<ConvergenceResult, { label: string; color: string; icon: string }> = {
  ally: { label: "Allied", color: "text-green-500", icon: "🛡️" },
  enemy: { label: "Enemies", color: "text-red-500", icon: "⚔️" },
  neutral: { label: "Neutral", color: "text-muted-foreground", icon: "➖" },
};

export const useConvergence = (campaignId: string) => {
  const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);
  const [convergenceNodes, setConvergenceNodes] = useState<ConvergenceNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntryPoints = useCallback(async () => {
    if (!campaignId) return;

    const { data, error } = await supabase
      .from("rp_campaign_entry_points")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("order_index");

    if (error) {
      console.error("Error fetching entry points:", error);
      return;
    }

    setEntryPoints(data || []);
  }, [campaignId]);

  const fetchConvergenceNodes = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data: nodeData, error } = await supabase
      .from("rp_convergence_nodes")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at");

    if (error) {
      console.error("Error fetching convergence nodes:", error);
      setLoading(false);
      return;
    }

    // Fetch rules for each convergence node
    const nodeIds = (nodeData || []).map((n) => n.id);
    let rulesData: ConvergenceRule[] = [];

    if (nodeIds.length > 0) {
      const { data } = await supabase
        .from("rp_convergence_rules")
        .select("*")
        .in("convergence_id", nodeIds)
        .order("priority", { ascending: false });

      rulesData = (data || []).map((r) => ({
        ...r,
        result: r.result as ConvergenceResult,
        conditions: (r.conditions as Record<string, unknown>) || {},
      }));
    }

    const mapped: ConvergenceNode[] = (nodeData || []).map((n) => ({
      ...n,
      convergence_type: n.convergence_type as ConvergenceType,
      required_entry_points: (n.required_entry_points as string[]) || [],
      rules: rulesData.filter((r) => r.convergence_id === n.id),
    }));

    setConvergenceNodes(mapped);
    setLoading(false);
  }, [campaignId]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchEntryPoints(), fetchConvergenceNodes()]);
  }, [fetchEntryPoints, fetchConvergenceNodes]);

  // Entry Point CRUD
  const createEntryPoint = async (
    entryLabel: string,
    options?: {
      start_node_id?: string;
      faction_id?: string;
      description?: string;
      image_url?: string;
      max_players?: number;
    }
  ) => {
    const maxOrder = entryPoints.length > 0 
      ? Math.max(...entryPoints.map((e) => e.order_index)) 
      : -1;

    const { data, error } = await supabase
      .from("rp_campaign_entry_points")
      .insert({
        campaign_id: campaignId,
        entry_label: entryLabel,
        start_node_id: options?.start_node_id || null,
        faction_id: options?.faction_id || null,
        description: options?.description || null,
        image_url: options?.image_url || null,
        max_players: options?.max_players ?? 1,
        order_index: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create entry point", variant: "destructive" });
      return null;
    }

    toast({ title: "Entry point created!" });
    await fetchEntryPoints();
    return data;
  };

  const updateEntryPoint = async (id: string, updates: Partial<EntryPoint>) => {
    const { error } = await supabase
      .from("rp_campaign_entry_points")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update entry point", variant: "destructive" });
      return false;
    }

    await fetchEntryPoints();
    return true;
  };

  const deleteEntryPoint = async (id: string) => {
    const { error } = await supabase
      .from("rp_campaign_entry_points")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete entry point", variant: "destructive" });
      return false;
    }

    toast({ title: "Entry point deleted" });
    await fetchEntryPoints();
    return true;
  };

  // Convergence Node CRUD
  const createConvergenceNode = async (
    nodeId: string,
    name: string,
    convergenceType: ConvergenceType,
    options?: {
      required_entry_points?: string[];
      description?: string;
    }
  ) => {
    const { data, error } = await supabase
      .from("rp_convergence_nodes")
      .insert({
        campaign_id: campaignId,
        node_id: nodeId,
        name,
        convergence_type: convergenceType,
        required_entry_points: JSON.parse(JSON.stringify(options?.required_entry_points || [])),
        description: options?.description || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create convergence node", variant: "destructive" });
      return null;
    }

    toast({ title: "Convergence node created!" });
    await fetchConvergenceNodes();
    return data;
  };

  const updateConvergenceNode = async (id: string, updates: Partial<ConvergenceNode>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.convergence_type !== undefined) updateData.convergence_type = updates.convergence_type;
    if (updates.required_entry_points !== undefined) {
      updateData.required_entry_points = JSON.parse(JSON.stringify(updates.required_entry_points));
    }

    const { error } = await supabase
      .from("rp_convergence_nodes")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update convergence node", variant: "destructive" });
      return false;
    }

    await fetchConvergenceNodes();
    return true;
  };

  const deleteConvergenceNode = async (id: string) => {
    const { error } = await supabase
      .from("rp_convergence_nodes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete convergence node", variant: "destructive" });
      return false;
    }

    toast({ title: "Convergence node deleted" });
    await fetchConvergenceNodes();
    return true;
  };

  // Convergence Rule CRUD
  const createRule = async (
    convergenceId: string,
    conditionType: string,
    conditions: Record<string, unknown>,
    result: ConvergenceResult,
    options?: {
      result_narrative?: string;
      target_node_id?: string;
      priority?: number;
    }
  ) => {
    const { error } = await supabase.from("rp_convergence_rules").insert({
      convergence_id: convergenceId,
      condition_type: conditionType,
      conditions: JSON.parse(JSON.stringify(conditions)),
      result,
      result_narrative: options?.result_narrative || null,
      target_node_id: options?.target_node_id || null,
      priority: options?.priority ?? 0,
    });

    if (error) {
      toast({ title: "Failed to create rule", variant: "destructive" });
      return false;
    }

    toast({ title: "Rule added!" });
    await fetchConvergenceNodes();
    return true;
  };

  const deleteRule = async (ruleId: string) => {
    const { error } = await supabase
      .from("rp_convergence_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      toast({ title: "Failed to delete rule", variant: "destructive" });
      return false;
    }

    await fetchConvergenceNodes();
    return true;
  };

  /**
   * Resolve the convergence outcome for a set of participants
   */
  const resolveConvergence = (
    convergenceNode: ConvergenceNode,
    participantData: Array<{
      character_id: string;
      entry_point_id: string;
      faction_id?: string;
      story_flags: Record<string, unknown>;
    }>
  ): { result: ConvergenceResult; narrative: string | null; targetNodeId: string | null } => {
    if (!convergenceNode.rules || convergenceNode.rules.length === 0) {
      return { result: "neutral", narrative: null, targetNodeId: null };
    }

    // Sort rules by priority (highest first)
    const sortedRules = [...convergenceNode.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      let conditionMet = false;

      switch (rule.condition_type) {
        case "faction":
          // Check if all participants are in the same faction
          const factions = participantData.map((p) => p.faction_id).filter(Boolean);
          const sameFaction = factions.length > 0 && new Set(factions).size === 1;
          conditionMet = rule.conditions.faction_match ? sameFaction : !sameFaction;
          break;

        case "flag":
          // Check if a specific flag is set for all participants
          const flagName = rule.conditions.flag as string;
          const flagValue = rule.conditions.value;
          conditionMet = participantData.every(
            (p) => p.story_flags[flagName] === flagValue
          );
          break;

        case "entry_point":
          // Check entry point combinations
          const requiredCombination = rule.conditions.entry_points as string[];
          const participantEntryPoints = participantData.map((p) => p.entry_point_id);
          conditionMet = requiredCombination?.every((ep) =>
            participantEntryPoints.includes(ep)
          ) ?? false;
          break;

        default:
          conditionMet = false;
      }

      if (conditionMet) {
        return {
          result: rule.result,
          narrative: rule.result_narrative,
          targetNodeId: rule.target_node_id,
        };
      }
    }

    return { result: "neutral", narrative: null, targetNodeId: null };
  };

  return {
    entryPoints,
    convergenceNodes,
    loading,
    fetchAll,
    fetchEntryPoints,
    fetchConvergenceNodes,
    createEntryPoint,
    updateEntryPoint,
    deleteEntryPoint,
    createConvergenceNode,
    updateConvergenceNode,
    deleteConvergenceNode,
    createRule,
    deleteRule,
    resolveConvergence,
  };
};
