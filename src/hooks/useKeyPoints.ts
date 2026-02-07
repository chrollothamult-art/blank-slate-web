import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface KeyPoint {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
  conditions: Record<string, unknown>;
  node_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyPointPath {
  id: string;
  source_key_point_id: string;
  target_key_point_id: string;
  path_type: "linear" | "conditional" | "random";
  conditions: Record<string, unknown>;
  weight: number;
  created_at: string;
}

export const useKeyPoints = (campaignId: string) => {
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [paths, setPaths] = useState<KeyPointPath[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeyPoints = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data: kpData, error: kpError } = await supabase
      .from("rp_key_points")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("order_index");

    if (kpError) {
      console.error("Error fetching key points:", kpError);
      setLoading(false);
      return;
    }

    const mapped: KeyPoint[] = (kpData || []).map((kp) => ({
      ...kp,
      conditions: (kp.conditions as Record<string, unknown>) || {},
    }));
    setKeyPoints(mapped);

    // Fetch paths
    const kpIds = mapped.map((kp) => kp.id);
    if (kpIds.length > 0) {
      const { data: pathData } = await supabase
        .from("rp_key_point_paths")
        .select("*")
        .in("source_key_point_id", kpIds);

      const mappedPaths: KeyPointPath[] = (pathData || []).map((p) => ({
        ...p,
        path_type: p.path_type as KeyPointPath["path_type"],
        conditions: (p.conditions as Record<string, unknown>) || {},
      }));
      setPaths(mappedPaths);
    }

    setLoading(false);
  }, [campaignId]);

  const createKeyPoint = async (title: string, description?: string) => {
    const { data, error } = await supabase
      .from("rp_key_points")
      .insert({
        campaign_id: campaignId,
        title,
        description: description || null,
        order_index: keyPoints.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create key point", variant: "destructive" });
      return null;
    }

    toast({ title: "Key point created!" });
    await fetchKeyPoints();
    return data;
  };

  const updateKeyPoint = async (id: string, updates: Partial<KeyPoint>) => {
    const { error } = await supabase
      .from("rp_key_points")
      .update({
        title: updates.title,
        description: updates.description,
        is_required: updates.is_required,
        node_id: updates.node_id,
        order_index: updates.order_index,
        conditions: updates.conditions ? JSON.parse(JSON.stringify(updates.conditions)) : undefined,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update key point", variant: "destructive" });
      return false;
    }

    await fetchKeyPoints();
    return true;
  };

  const deleteKeyPoint = async (id: string) => {
    const { error } = await supabase
      .from("rp_key_points")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete key point", variant: "destructive" });
      return false;
    }

    toast({ title: "Key point deleted" });
    await fetchKeyPoints();
    return true;
  };

  const createPath = async (
    sourceId: string,
    targetId: string,
    pathType: KeyPointPath["path_type"] = "linear"
  ) => {
    const { error } = await supabase
      .from("rp_key_point_paths")
      .insert({
        source_key_point_id: sourceId,
        target_key_point_id: targetId,
        path_type: pathType,
      });

    if (error) {
      toast({ title: "Failed to create path", variant: "destructive" });
      return false;
    }

    await fetchKeyPoints();
    return true;
  };

  const deletePath = async (id: string) => {
    const { error } = await supabase
      .from("rp_key_point_paths")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete path", variant: "destructive" });
      return false;
    }

    await fetchKeyPoints();
    return true;
  };

  return {
    keyPoints,
    paths,
    loading,
    fetchKeyPoints,
    createKeyPoint,
    updateKeyPoint,
    deleteKeyPoint,
    createPath,
    deletePath,
  };
};
