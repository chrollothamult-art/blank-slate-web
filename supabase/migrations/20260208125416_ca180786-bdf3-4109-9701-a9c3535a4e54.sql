-- =============================================
-- Phase 11: IP Scores & Hidden Combat System
-- =============================================

-- Table: rp_character_ip_scores - IP score between character pairs
CREATE TABLE public.rp_character_ip_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_a_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  character_b_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  relationship_level TEXT NOT NULL DEFAULT 'neutral', -- blood_feud, hostile, distrustful, neutral, friendly, bonded, sworn
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_ip_character_pair UNIQUE (session_id, character_a_id, character_b_id),
  CONSTRAINT different_ip_characters CHECK (character_a_id != character_b_id),
  CONSTRAINT ip_score_range CHECK (score >= -100 AND score <= 100)
);

-- Table: rp_ip_threshold_events - Events triggered by IP thresholds
CREATE TABLE public.rp_ip_threshold_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  threshold_min INTEGER NOT NULL,
  threshold_max INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'forced_choice', 'alliance', 'duel', 'bonus', 'penalty', 'unlock_path'
  event_payload JSONB NOT NULL DEFAULT '{}',
  target_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_ip_threshold CHECK (threshold_min <= threshold_max)
);

-- Table: rp_ip_change_history - Full log of IP changes
CREATE TABLE public.rp_ip_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_a_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  character_b_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  old_level TEXT NOT NULL,
  new_level TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_action_id UUID REFERENCES public.rp_action_log(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: rp_combat_encounters - PvP/PvE combat instances with hidden stats
CREATE TABLE public.rp_combat_encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  combat_type TEXT NOT NULL DEFAULT 'pvp', -- 'pvp', 'pve', 'duel'
  participants JSONB NOT NULL DEFAULT '[]', -- Array of { character_id, role, visible_equipment }
  stats_hidden BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'resolved'
  outcome JSONB, -- { winner_id, loser_id, type: 'knockout'/'death'/'surrender', damage_dealt }
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Table: rp_bluff_attempts - Track bluff and scouting actions
CREATE TABLE public.rp_bluff_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL, -- 'flex', 'feign_weakness', 'scout', 'intimidate'
  stat_used TEXT NOT NULL, -- 'charisma', 'stealth', 'perception'
  roll_value INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  revealed_info JSONB, -- If scouting succeeded: { stat: 'agility', hint: 'seems agile but frail' }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rp_character_ip_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_ip_threshold_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_ip_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_combat_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_bluff_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rp_character_ip_scores
CREATE POLICY "Session participants can view IP scores"
  ON public.rp_character_ip_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_session_participants sp
      JOIN public.rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_character_ip_scores.session_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can manage their IP scores"
  ON public.rp_character_ip_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_characters c
      WHERE (c.id = rp_character_ip_scores.character_a_id OR c.id = rp_character_ip_scores.character_b_id)
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_ip_threshold_events
CREATE POLICY "Anyone can view campaign IP events"
  ON public.rp_ip_threshold_events FOR SELECT
  USING (true);

CREATE POLICY "Campaign authors can manage IP events"
  ON public.rp_ip_threshold_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_campaigns c
      WHERE c.id = rp_ip_threshold_events.campaign_id
      AND c.author_id = auth.uid()
    )
  );

-- RLS Policies for rp_ip_change_history
CREATE POLICY "Session participants can view IP history"
  ON public.rp_ip_change_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_session_participants sp
      JOIN public.rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_ip_change_history.session_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can insert IP history"
  ON public.rp_ip_change_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rp_characters c
      WHERE (c.id = character_a_id OR c.id = character_b_id)
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_combat_encounters
CREATE POLICY "Session participants can view combat"
  ON public.rp_combat_encounters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_session_participants sp
      JOIN public.rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_combat_encounters.session_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can manage combat"
  ON public.rp_combat_encounters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_session_participants sp
      JOIN public.rp_characters c ON c.id = sp.character_id
      WHERE sp.session_id = rp_combat_encounters.session_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for rp_bluff_attempts
CREATE POLICY "Participants can view their bluff attempts"
  ON public.rp_bluff_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rp_characters c
      WHERE (c.id = rp_bluff_attempts.actor_id OR c.id = rp_bluff_attempts.target_id)
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Actors can create bluff attempts"
  ON public.rp_bluff_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rp_characters c
      WHERE c.id = actor_id AND c.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_ip_scores_session ON public.rp_character_ip_scores(session_id);
CREATE INDEX idx_ip_scores_characters ON public.rp_character_ip_scores(character_a_id, character_b_id);
CREATE INDEX idx_ip_scores_level ON public.rp_character_ip_scores(relationship_level);
CREATE INDEX idx_ip_events_campaign ON public.rp_ip_threshold_events(campaign_id);
CREATE INDEX idx_ip_events_threshold ON public.rp_ip_threshold_events(threshold_min, threshold_max);
CREATE INDEX idx_ip_history_session ON public.rp_ip_change_history(session_id);
CREATE INDEX idx_combat_session ON public.rp_combat_encounters(session_id);
CREATE INDEX idx_combat_status ON public.rp_combat_encounters(status);
CREATE INDEX idx_bluff_session ON public.rp_bluff_attempts(session_id);

-- Create updated_at triggers
CREATE TRIGGER update_rp_character_ip_scores_updated_at
  BEFORE UPDATE ON public.rp_character_ip_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rp_ip_threshold_events_updated_at
  BEFORE UPDATE ON public.rp_ip_threshold_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();