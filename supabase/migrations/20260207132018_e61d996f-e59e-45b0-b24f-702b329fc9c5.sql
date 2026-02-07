-- Phase 8: Player-to-Player Physical Interaction System

-- Table: rp_player_positions - Track player proximity in scenes
CREATE TABLE public.rp_player_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  zone TEXT NOT NULL DEFAULT 'far' CHECK (zone IN ('far', 'mid', 'close', 'adjacent')),
  relative_to_character_id UUID REFERENCES public.rp_characters(id) ON DELETE SET NULL,
  scene_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, character_id, relative_to_character_id)
);

-- Table: rp_prepared_actions - Pre-planned hidden actions
CREATE TABLE public.rp_prepared_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_character_id UUID REFERENCES public.rp_characters(id) ON DELETE SET NULL,
  item_id TEXT,
  preparation JSONB DEFAULT '{}'::jsonb,
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  is_used BOOLEAN NOT NULL DEFAULT false,
  prepared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cooldown_until TIMESTAMP WITH TIME ZONE
);

-- Table: rp_action_log - All executed actions
CREATE TABLE public.rp_action_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.rp_characters(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT,
  stat_check_result JSONB,
  was_detected BOOLEAN DEFAULT false,
  outcome JSONB DEFAULT '{}'::jsonb,
  witnesses JSONB DEFAULT '[]'::jsonb,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: rp_perception_events - Detection alerts
CREATE TABLE public.rp_perception_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  observer_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  perception_roll INTEGER,
  detection_level TEXT NOT NULL DEFAULT 'oblivious' CHECK (detection_level IN ('oblivious', 'alert', 'vigilant', 'hawkeye')),
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: rp_action_definitions - Campaign-specific action definitions
CREATE TABLE public.rp_action_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  required_range TEXT NOT NULL DEFAULT 'close' CHECK (required_range IN ('far', 'mid', 'close', 'adjacent', 'any')),
  required_item TEXT,
  required_stat TEXT,
  required_stat_value INTEGER DEFAULT 0,
  is_detectable BOOLEAN DEFAULT true,
  detection_difficulty INTEGER DEFAULT 5,
  success_effect JSONB DEFAULT '{}'::jsonb,
  failure_effect JSONB DEFAULT '{}'::jsonb,
  cooldown_turns INTEGER DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: rp_pvp_settings - Campaign-level PvP configuration
CREATE TABLE public.rp_pvp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE UNIQUE,
  pvp_enabled BOOLEAN NOT NULL DEFAULT false,
  lethality_mode TEXT NOT NULL DEFAULT 'wound-only' CHECK (lethality_mode IN ('no-kill', 'wound-only', 'permadeath')),
  friendly_fire BOOLEAN NOT NULL DEFAULT false,
  require_consent BOOLEAN NOT NULL DEFAULT true,
  pvp_zones_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: rp_interaction_zones - Define PvP-enabled areas
CREATE TABLE public.rp_interaction_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'pvp' CHECK (zone_type IN ('pvp', 'safe', 'duel')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rp_player_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_prepared_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_perception_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_action_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_pvp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_interaction_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rp_player_positions
CREATE POLICY "Session participants can view positions"
  ON public.rp_player_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rp_session_participants sp
      JOIN rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_player_positions.session_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can update their position"
  ON public.rp_player_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rp_characters c
      WHERE c.id = rp_player_positions.character_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_prepared_actions
CREATE POLICY "Users can manage their own prepared actions"
  ON public.rp_prepared_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rp_characters c
      WHERE c.id = rp_prepared_actions.character_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can see revealed actions targeting them"
  ON public.rp_prepared_actions FOR SELECT
  USING (
    is_revealed = true AND
    EXISTS (
      SELECT 1 FROM rp_characters c
      WHERE c.id = rp_prepared_actions.target_character_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_action_log
CREATE POLICY "Session participants can view action log"
  ON public.rp_action_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rp_session_participants sp
      JOIN rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_action_log.session_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create action log entries"
  ON public.rp_action_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rp_characters c
      WHERE c.id = rp_action_log.actor_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_perception_events
CREATE POLICY "Users can view perception events for their characters"
  ON public.rp_perception_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rp_characters c
      WHERE c.id = rp_perception_events.observer_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can create perception events"
  ON public.rp_perception_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rp_session_participants sp
      JOIN rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_perception_events.session_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_action_definitions
CREATE POLICY "Anyone can view action definitions"
  ON public.rp_action_definitions FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage action definitions"
  ON public.rp_action_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rp_campaigns c
      WHERE c.id = rp_action_definitions.campaign_id
      AND c.author_id = auth.uid()
    )
  );

-- RLS Policies for rp_pvp_settings
CREATE POLICY "Anyone can view PvP settings"
  ON public.rp_pvp_settings FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage PvP settings"
  ON public.rp_pvp_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rp_campaigns c
      WHERE c.id = rp_pvp_settings.campaign_id
      AND c.author_id = auth.uid()
    )
  );

-- RLS Policies for rp_interaction_zones
CREATE POLICY "Anyone can view interaction zones"
  ON public.rp_interaction_zones FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage interaction zones"
  ON public.rp_interaction_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rp_campaigns c
      WHERE c.id = rp_interaction_zones.campaign_id
      AND c.author_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_player_positions_session ON public.rp_player_positions(session_id);
CREATE INDEX idx_player_positions_character ON public.rp_player_positions(character_id);
CREATE INDEX idx_prepared_actions_session ON public.rp_prepared_actions(session_id);
CREATE INDEX idx_prepared_actions_character ON public.rp_prepared_actions(character_id);
CREATE INDEX idx_action_log_session ON public.rp_action_log(session_id);
CREATE INDEX idx_action_log_actor ON public.rp_action_log(actor_id);
CREATE INDEX idx_perception_events_observer ON public.rp_perception_events(observer_id);
CREATE INDEX idx_action_definitions_campaign ON public.rp_action_definitions(campaign_id);

-- Trigger for updated_at
CREATE TRIGGER update_player_positions_updated_at
  BEFORE UPDATE ON public.rp_player_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pvp_settings_updated_at
  BEFORE UPDATE ON public.rp_pvp_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();