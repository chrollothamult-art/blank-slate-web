
-- Phase 9: Hint & Suggestion Engine tables

-- Hint definitions per campaign
CREATE TABLE public.rp_hints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  hint_type TEXT NOT NULL DEFAULT 'direction' CHECK (hint_type IN ('direction', 'action', 'social', 'discovery', 'warning')),
  hint_text TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  follow_outcome JSONB DEFAULT '{}',
  ignore_outcome JSONB DEFAULT '{}',
  opposite_outcome JSONB DEFAULT '{}',
  is_red_herring BOOLEAN DEFAULT false,
  source_flavor TEXT DEFAULT 'inner_voice' CHECK (source_flavor IN ('inner_voice', 'companion_whisper', 'environmental_clue', 'divine_sign')),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player reactions to hints
CREATE TABLE public.rp_hint_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  hint_id UUID NOT NULL REFERENCES public.rp_hints(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('followed', 'ignored', 'opposite')),
  triggered_event_id UUID,
  context JSONB DEFAULT '{}',
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Linked hint sequences (chains)
CREATE TABLE public.rp_hint_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  chain_name TEXT NOT NULL,
  hint_ids JSONB DEFAULT '[]',
  completion_reward JSONB DEFAULT '{}',
  chain_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rp_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_hint_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_hint_chains ENABLE ROW LEVEL SECURITY;

-- RLS policies for rp_hints (readable by all authenticated, writable by campaign author)
CREATE POLICY "Anyone can read hints" ON public.rp_hints FOR SELECT USING (true);
CREATE POLICY "Campaign authors can manage hints" ON public.rp_hints FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign authors can update hints" ON public.rp_hints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign authors can delete hints" ON public.rp_hints FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- RLS policies for rp_hint_responses
CREATE POLICY "Anyone can read hint responses" ON public.rp_hint_responses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert responses" ON public.rp_hint_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for rp_hint_chains
CREATE POLICY "Anyone can read hint chains" ON public.rp_hint_chains FOR SELECT USING (true);
CREATE POLICY "Campaign authors can manage hint chains" ON public.rp_hint_chains FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign authors can update hint chains" ON public.rp_hint_chains FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign authors can delete hint chains" ON public.rp_hint_chains FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_rp_hints_campaign ON public.rp_hints(campaign_id);
CREATE INDEX idx_rp_hints_node ON public.rp_hints(node_id);
CREATE INDEX idx_rp_hint_responses_session ON public.rp_hint_responses(session_id);
CREATE INDEX idx_rp_hint_responses_character ON public.rp_hint_responses(character_id);
CREATE INDEX idx_rp_hint_chains_campaign ON public.rp_hint_chains(campaign_id);
