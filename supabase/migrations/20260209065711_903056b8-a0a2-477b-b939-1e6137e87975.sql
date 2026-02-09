-- AI Dungeon Master Configuration
-- Stores AI settings per campaign for the AI DM feature

CREATE TABLE public.rp_campaign_ai_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  ai_enabled BOOLEAN DEFAULT false,
  dm_instructions TEXT,
  tone VARCHAR(100) DEFAULT 'balanced',
  guardrails JSONB DEFAULT '{"no_explicit_content": true, "family_friendly": false, "allow_violence": true, "always_offer_peaceful_option": false}'::jsonb,
  lore_context_ids JSONB DEFAULT '[]'::jsonb,
  npc_voice_profiles JSONB DEFAULT '{}'::jsonb,
  ai_narration_nodes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id)
);

-- AI Narration Log - tracks all AI-generated narrations
CREATE TABLE public.rp_ai_narration_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.rp_characters(id) ON DELETE SET NULL,
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  prompt_hash VARCHAR(64),
  narration_text TEXT NOT NULL,
  model_used VARCHAR(100) DEFAULT 'google/gemini-3-flash-preview',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rp_campaign_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_ai_narration_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Config
CREATE POLICY "Campaign authors can manage AI config"
ON public.rp_campaign_ai_config
FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM public.rp_campaigns WHERE author_id = auth.uid()
  )
)
WITH CHECK (
  campaign_id IN (
    SELECT id FROM public.rp_campaigns WHERE author_id = auth.uid()
  )
);

CREATE POLICY "Anyone can read AI config of published campaigns"
ON public.rp_campaign_ai_config
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.rp_campaigns WHERE is_published = true
  )
);

-- RLS Policies for Narration Log
CREATE POLICY "Users can view their own narration logs"
ON public.rp_ai_narration_log
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.rp_sessions WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert narration logs for their sessions"
ON public.rp_ai_narration_log
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.rp_sessions WHERE created_by = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_ai_config_campaign ON public.rp_campaign_ai_config(campaign_id);
CREATE INDEX idx_narration_log_session ON public.rp_ai_narration_log(session_id);
CREATE INDEX idx_narration_log_node ON public.rp_ai_narration_log(node_id);

-- Trigger to update updated_at
CREATE TRIGGER update_rp_campaign_ai_config_updated_at
  BEFORE UPDATE ON public.rp_campaign_ai_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();