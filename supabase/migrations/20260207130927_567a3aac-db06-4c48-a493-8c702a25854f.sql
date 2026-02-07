
-- Phase 5: Free-text input support
ALTER TABLE public.rp_story_nodes ADD COLUMN allows_free_text boolean NOT NULL DEFAULT false;
ALTER TABLE public.rp_story_nodes ADD COLUMN free_text_prompt text;

CREATE TABLE public.rp_free_text_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.rp_story_nodes(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rp_free_text_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own free text responses"
  ON public.rp_free_text_responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rp_sessions s WHERE s.id = session_id AND s.created_by = auth.uid())
  );

CREATE POLICY "Users can insert their own free text responses"
  ON public.rp_free_text_responses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.rp_sessions s WHERE s.id = session_id AND s.created_by = auth.uid())
  );

-- Phase 6: Cascading effects engine
CREATE TABLE public.rp_cascade_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  source_interaction_id TEXT NOT NULL,
  source_outcome_type TEXT NOT NULL DEFAULT 'good',
  target_interaction_id TEXT NOT NULL,
  effect_type TEXT NOT NULL DEFAULT 'unlock',
  effect_value JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rp_cascade_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cascade rules" ON public.rp_cascade_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage cascade rules" ON public.rp_cascade_rules FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.rp_cascade_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  cascade_rule_id UUID NOT NULL REFERENCES public.rp_cascade_rules(id) ON DELETE CASCADE,
  context JSONB NOT NULL DEFAULT '{}',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rp_cascade_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cascade logs" ON public.rp_cascade_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rp_sessions s WHERE s.id = session_id AND s.created_by = auth.uid())
);
CREATE POLICY "Users can insert cascade logs" ON public.rp_cascade_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_sessions s WHERE s.id = session_id AND s.created_by = auth.uid())
);

-- Phase 7: Post-convergence branching (ally/enemy/neutral paths)
ALTER TABLE public.rp_convergence_nodes ADD COLUMN ally_node_id UUID REFERENCES public.rp_story_nodes(id);
ALTER TABLE public.rp_convergence_nodes ADD COLUMN enemy_node_id UUID REFERENCES public.rp_story_nodes(id);
ALTER TABLE public.rp_convergence_nodes ADD COLUMN neutral_node_id UUID REFERENCES public.rp_story_nodes(id);

-- Phase 7: Split & Reconverge support
ALTER TABLE public.rp_convergence_nodes ADD COLUMN is_reconvergence BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.rp_convergence_nodes ADD COLUMN split_from_convergence_id UUID REFERENCES public.rp_convergence_nodes(id);
ALTER TABLE public.rp_convergence_nodes ADD COLUMN reconverge_order INTEGER NOT NULL DEFAULT 0;
