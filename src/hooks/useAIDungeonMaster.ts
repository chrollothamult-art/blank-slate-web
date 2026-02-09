import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface NpcDialogue {
  name: string;
  text: string;
}

interface NarrationResult {
  narration: string;
  npc_dialogue: NpcDialogue[];
  cached: boolean;
  tokens_used?: number;
}

type TransitionType = "arrival" | "departure" | "event" | "narrative";

export const useAIDungeonMaster = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentNarration, setCurrentNarration] = useState<string | null>(null);
  const [npcDialogue, setNpcDialogue] = useState<NpcDialogue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateNarration = useCallback(async (
    sessionId: string,
    characterId: string,
    currentNodeId: string,
    options?: {
      actionContext?: string;
      transitionType?: TransitionType;
    }
  ): Promise<NarrationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://pwbpbsyagyoytniidoah.functions.supabase.co/ai-dungeon-master",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            characterId,
            currentNodeId,
            actionContext: options?.actionContext,
            transitionType: options?.transitionType || "narrative",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please check your usage limits.");
        }
        
        throw new Error(errorData.error || "Failed to generate narration");
      }

      const data: NarrationResult = await response.json();
      
      setCurrentNarration(data.narration);
      setNpcDialogue(data.npc_dialogue || []);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("AI DM error:", err);
      
      toast({
        title: "AI Narration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearNarration = useCallback(() => {
    setCurrentNarration(null);
    setNpcDialogue([]);
    setError(null);
  }, []);

  /**
   * Check if AI DM is enabled for a campaign
   */
  const checkAIEnabled = useCallback(async (campaignId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("rp_campaign_ai_config")
      .select("ai_enabled")
      .eq("campaign_id", campaignId)
      .single();

    return data?.ai_enabled ?? false;
  }, []);

  /**
   * Get recent narration logs for a session
   */
  const getNarrationHistory = useCallback(async (sessionId: string, limit = 10) => {
    const { data, error } = await supabase
      .from("rp_ai_narration_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching narration history:", error);
      return [];
    }

    return data || [];
  }, []);

  return {
    isLoading,
    currentNarration,
    npcDialogue,
    error,
    generateNarration,
    clearNarration,
    checkAIEnabled,
    getNarrationHistory,
  };
};
