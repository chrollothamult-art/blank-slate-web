
-- ============================================
-- Key Points & Dynamic Pathways
-- ============================================

-- Major story milestones that anchor the narrative arc
CREATE TABLE public.rp_key_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}',
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connections between key points
CREATE TABLE public.rp_key_point_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_key_point_id UUID NOT NULL REFERENCES public.rp_key_points(id) ON DELETE CASCADE,
  target_key_point_id UUID NOT NULL REFERENCES public.rp_key_points(id) ON DELETE CASCADE,
  path_type TEXT NOT NULL DEFAULT 'linear' CHECK (path_type IN ('linear', 'conditional', 'random')),
  conditions JSONB DEFAULT '{}',
  weight INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Event Trigger System
-- ============================================

-- Trigger definitions for campaigns
CREATE TABLE public.rp_event_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stat_threshold', 'item_possessed', 'flag_set', 'relationship_score', 'faction_reputation', 'choice_made', 'player_count', 'random_chance')),
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events that fire when triggers are met
CREATE TABLE public.rp_triggered_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  trigger_id UUID NOT NULL REFERENCES public.rp_event_triggers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('unlock_path', 'spawn_node', 'modify_stat', 'grant_item', 'set_flag', 'show_message', 'award_xp')),
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-session trigger activation log
CREATE TABLE public.rp_session_trigger_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  trigger_id UUID NOT NULL REFERENCES public.rp_event_triggers(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.rp_characters(id) ON DELETE SET NULL,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context JSONB DEFAULT '{}'
);

-- ============================================
-- RLS Policies
-- ============================================

-- Key Points: read by everyone, write by campaign author
ALTER TABLE public.rp_key_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Key points are viewable by everyone"
  ON public.rp_key_points FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage key points"
  ON public.rp_key_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_campaigns 
      WHERE id = rp_key_points.campaign_id 
      AND author_id = auth.uid()
    )
  );

-- Key Point Paths: read by everyone, write by campaign author
ALTER TABLE public.rp_key_point_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Key point paths are viewable by everyone"
  ON public.rp_key_point_paths FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage key point paths"
  ON public.rp_key_point_paths FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_key_points kp
      JOIN public.rp_campaigns c ON c.id = kp.campaign_id
      WHERE kp.id = rp_key_point_paths.source_key_point_id
      AND c.author_id = auth.uid()
    )
  );

-- Event Triggers: read by everyone, write by campaign author
ALTER TABLE public.rp_event_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event triggers are viewable by everyone"
  ON public.rp_event_triggers FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage event triggers"
  ON public.rp_event_triggers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_campaigns 
      WHERE id = rp_event_triggers.campaign_id 
      AND author_id = auth.uid()
    )
  );

-- Triggered Events: read by everyone, write by campaign author
ALTER TABLE public.rp_triggered_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Triggered events are viewable by everyone"
  ON public.rp_triggered_events FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage triggered events"
  ON public.rp_triggered_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_campaigns 
      WHERE id = rp_triggered_events.campaign_id 
      AND author_id = auth.uid()
    )
  );

-- Session Trigger Log: viewable by session participants
ALTER TABLE public.rp_session_trigger_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session trigger logs are viewable by session creator"
  ON public.rp_session_trigger_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_sessions 
      WHERE id = rp_session_trigger_log.session_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert trigger logs"
  ON public.rp_session_trigger_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_rp_key_points_campaign ON public.rp_key_points(campaign_id);
CREATE INDEX idx_rp_key_point_paths_source ON public.rp_key_point_paths(source_key_point_id);
CREATE INDEX idx_rp_key_point_paths_target ON public.rp_key_point_paths(target_key_point_id);
CREATE INDEX idx_rp_event_triggers_campaign ON public.rp_event_triggers(campaign_id);
CREATE INDEX idx_rp_triggered_events_trigger ON public.rp_triggered_events(trigger_id);
CREATE INDEX idx_rp_session_trigger_log_session ON public.rp_session_trigger_log(session_id);

-- Update timestamp triggers
CREATE TRIGGER update_rp_key_points_updated_at
  BEFORE UPDATE ON public.rp_key_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rp_event_triggers_updated_at
  BEFORE UPDATE ON public.rp_event_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
