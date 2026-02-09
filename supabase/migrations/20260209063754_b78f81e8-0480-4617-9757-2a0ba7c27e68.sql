
-- Character death & failure system
ALTER TABLE public.rp_characters 
ADD COLUMN IF NOT EXISTS death_context JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fallen_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS injury_penalties JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS legacy_bonuses JSONB DEFAULT '{}'::jsonb;

-- Track stat checks by type for Charismatic achievement
ALTER TABLE public.rp_character_progress
ADD COLUMN IF NOT EXISTS stat_checks_by_type JSONB DEFAULT '{}'::jsonb;

-- Track endings seen per campaign for Completionist achievement
CREATE TABLE IF NOT EXISTS public.rp_campaign_endings_seen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  ending_node_id UUID NOT NULL,
  seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, ending_node_id)
);

ALTER TABLE public.rp_campaign_endings_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own endings" 
ON public.rp_campaign_endings_seen 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own endings" 
ON public.rp_campaign_endings_seen 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_endings_seen_user ON public.rp_campaign_endings_seen(user_id, campaign_id);
