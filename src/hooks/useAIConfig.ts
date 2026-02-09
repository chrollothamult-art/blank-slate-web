import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AIGuardrails {
  no_explicit_content: boolean;
  family_friendly: boolean;
  allow_violence: boolean;
  always_offer_peaceful_option: boolean;
}

export interface NPCVoiceProfile {
  name: string;
  style: string;
  traits: string[];
}

export interface AIConfig {
  id: string;
  campaign_id: string;
  ai_enabled: boolean;
  dm_instructions: string | null;
  tone: string;
  guardrails: AIGuardrails;
  lore_context_ids: string[];
  npc_voice_profiles: Record<string, NPCVoiceProfile>;
  ai_narration_nodes: string[];
  created_at: string;
  updated_at: string;
}

const DEFAULT_GUARDRAILS: AIGuardrails = {
  no_explicit_content: true,
  family_friendly: false,
  allow_violence: true,
  always_offer_peaceful_option: false
};

export const useAIConfig = (campaignId: string) => {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_campaign_ai_config")
      .select("*")
      .eq("campaign_id", campaignId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching AI config:", error);
    }

    if (data) {
      setConfig({
        id: data.id,
        campaign_id: data.campaign_id,
        ai_enabled: data.ai_enabled ?? false,
        dm_instructions: data.dm_instructions,
        tone: data.tone ?? "balanced",
        guardrails: (data.guardrails as unknown as AIGuardrails) ?? DEFAULT_GUARDRAILS,
        lore_context_ids: (data.lore_context_ids as unknown as string[]) ?? [],
        npc_voice_profiles: (data.npc_voice_profiles as unknown as Record<string, NPCVoiceProfile>) ?? {},
        ai_narration_nodes: (data.ai_narration_nodes as string[]) ?? [],
        created_at: data.created_at,
        updated_at: data.updated_at
      });
    }

    setLoading(false);
  }, [campaignId]);

  const createOrUpdateConfig = async (updates: Partial<Omit<AIConfig, "id" | "campaign_id" | "created_at" | "updated_at">>) => {
    if (!campaignId) return null;
    setSaving(true);

    const payload: Record<string, unknown> = {
      campaign_id: campaignId,
      ai_enabled: updates.ai_enabled ?? config?.ai_enabled ?? false,
      dm_instructions: updates.dm_instructions ?? config?.dm_instructions ?? null,
      tone: updates.tone ?? config?.tone ?? "balanced",
      guardrails: updates.guardrails ?? config?.guardrails ?? DEFAULT_GUARDRAILS,
      lore_context_ids: updates.lore_context_ids ?? config?.lore_context_ids ?? [],
      npc_voice_profiles: updates.npc_voice_profiles ?? config?.npc_voice_profiles ?? {},
      ai_narration_nodes: updates.ai_narration_nodes ?? config?.ai_narration_nodes ?? []
    };

    const { data, error } = await supabase
      .from("rp_campaign_ai_config")
      .upsert(payload as any, { onConflict: "campaign_id" })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to save AI config", description: error.message, variant: "destructive" });
      setSaving(false);
      return null;
    }

    toast({ title: "AI configuration saved!" });
    await fetchConfig();
    setSaving(false);
    return data;
  };

  const toggleAI = async (enabled: boolean) => {
    return createOrUpdateConfig({ ai_enabled: enabled });
  };

  const updateDMInstructions = async (instructions: string) => {
    return createOrUpdateConfig({ dm_instructions: instructions });
  };

  const updateTone = async (tone: string) => {
    return createOrUpdateConfig({ tone });
  };

  const updateGuardrails = async (guardrails: AIGuardrails) => {
    return createOrUpdateConfig({ guardrails });
  };

  const addNPCVoiceProfile = async (npcId: string, profile: NPCVoiceProfile) => {
    const newProfiles = { ...(config?.npc_voice_profiles || {}), [npcId]: profile };
    return createOrUpdateConfig({ npc_voice_profiles: newProfiles });
  };

  const removeNPCVoiceProfile = async (npcId: string) => {
    const newProfiles = { ...(config?.npc_voice_profiles || {}) };
    delete newProfiles[npcId];
    return createOrUpdateConfig({ npc_voice_profiles: newProfiles });
  };

  const toggleNodeNarration = async (nodeId: string, enabled: boolean) => {
    const currentNodes = config?.ai_narration_nodes || [];
    const newNodes = enabled
      ? [...currentNodes, nodeId]
      : currentNodes.filter(id => id !== nodeId);
    return createOrUpdateConfig({ ai_narration_nodes: newNodes });
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    saving,
    createOrUpdateConfig,
    toggleAI,
    updateDMInstructions,
    updateTone,
    updateGuardrails,
    addNPCVoiceProfile,
    removeNPCVoiceProfile,
    toggleNodeNarration,
    refetch: fetchConfig
  };
};
