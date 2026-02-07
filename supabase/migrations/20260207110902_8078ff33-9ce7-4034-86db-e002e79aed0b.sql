-- =============================================
-- LORE CHRONICLES ADVANCED SYSTEMS SCHEMA
-- Random Events, Interaction Points, Convergence, Factions
-- =============================================

-- =============================================
-- 1. RANDOM EVENTS SYSTEM
-- =============================================

-- Random event definitions per campaign
CREATE TABLE public.rp_random_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'encounter', -- encounter, weather, fortune, misfortune, discovery, ambush
  probability INTEGER NOT NULL DEFAULT 10 CHECK (probability >= 1 AND probability <= 100), -- % chance when conditions met
  conditions JSONB DEFAULT '{}', -- {stat_threshold, flag_set, turn_count, location, etc.}
  effects JSONB DEFAULT '{}', -- {modify_stat, grant_item, set_flag, trigger_node, show_message}
  is_recurring BOOLEAN DEFAULT false,
  cooldown_turns INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log of when random events fired in sessions
CREATE TABLE public.rp_random_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.rp_random_events(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.rp_characters(id) ON DELETE SET NULL,
  fired_at TIMESTAMPTZ DEFAULT now(),
  outcome JSONB DEFAULT '{}', -- What actually happened
  was_positive BOOLEAN DEFAULT true
);

-- =============================================
-- 2. INTERACTION POINTS SYSTEM
-- =============================================

-- Interaction point definitions (special nodes where characters interact)
CREATE TABLE public.rp_interaction_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  interaction_type TEXT NOT NULL DEFAULT 'dialogue', -- dialogue, trade, combat, persuasion, alliance, betrayal
  description TEXT,
  participants JSONB DEFAULT '[]', -- [{type: 'player'}, {type: 'npc', npc_id: '...'}]
  stat_requirements JSONB DEFAULT '{}', -- {charisma: 4, strength: 3}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Outcome templates for each participant in an interaction
CREATE TABLE public.rp_interaction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID NOT NULL REFERENCES public.rp_interaction_points(id) ON DELETE CASCADE,
  participant_role TEXT NOT NULL DEFAULT 'player', -- player, npc, initiator, target
  result_type TEXT NOT NULL DEFAULT 'neutral', -- good, bad, neutral
  condition JSONB DEFAULT '{}', -- What must be true for this outcome
  stat_effects JSONB DEFAULT '{}', -- {charisma: +1, strength: -1}
  flag_effects JSONB DEFAULT '{}', -- {met_elder: true, betrayed_guild: true}
  reputation_effects JSONB DEFAULT '{}', -- {faction_id: +10}
  narrative_text TEXT,
  target_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log of interactions that occurred in sessions
CREATE TABLE public.rp_interaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  interaction_id UUID NOT NULL REFERENCES public.rp_interaction_points(id) ON DELETE CASCADE,
  participants JSONB NOT NULL DEFAULT '[]', -- [{character_id: '...', role: 'initiator'}, ...]
  outcome_id UUID REFERENCES public.rp_interaction_outcomes(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 3. MULTIPLAYER CONVERGENCE SYSTEM
-- =============================================

-- Multiple entry points per campaign (different starting branches)
CREATE TABLE public.rp_campaign_entry_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  entry_label TEXT NOT NULL, -- "The Rebel Path", "The Crown's Agent", etc.
  start_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  faction_id UUID REFERENCES public.rp_factions(id) ON DELETE SET NULL, -- Link to faction system
  description TEXT,
  image_url TEXT,
  max_players INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Convergence nodes where paths merge
CREATE TABLE public.rp_convergence_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.rp_story_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  convergence_type TEXT NOT NULL DEFAULT 'merge', -- merge, clash, negotiate
  required_entry_points JSONB DEFAULT '[]', -- [entry_point_id, entry_point_id]
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rules for how alliances/enemies are determined at convergence
CREATE TABLE public.rp_convergence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id UUID NOT NULL REFERENCES public.rp_convergence_nodes(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL DEFAULT 'faction', -- faction, flag, reputation, choice
  conditions JSONB NOT NULL DEFAULT '{}', -- {faction_match: true} or {flag: 'helped_rebels', value: true}
  result TEXT NOT NULL DEFAULT 'neutral', -- ally, enemy, neutral
  result_narrative TEXT,
  target_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0, -- Higher = checked first
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track which entry point each character selected
ALTER TABLE public.rp_session_participants 
ADD COLUMN IF NOT EXISTS entry_point_id UUID REFERENCES public.rp_campaign_entry_points(id) ON DELETE SET NULL;

-- =============================================
-- 4. CAMPAIGN FACTION SYSTEM (extends existing rp_factions)
-- =============================================

-- Link factions to specific campaigns (campaign-scoped factions)
CREATE TABLE public.rp_campaign_factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  faction_id UUID REFERENCES public.rp_factions(id) ON DELETE SET NULL, -- Optional link to global faction
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  color TEXT DEFAULT '#6366f1',
  values JSONB DEFAULT '{}', -- {honor: 'high', mercy: 'low', ambition: 'medium'}
  perks JSONB DEFAULT '[]', -- [{level: 'friendly', perk: 'Discount at guild shops'}, ...]
  is_joinable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relationships between campaign factions
CREATE TABLE public.rp_faction_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  faction_a_id UUID NOT NULL REFERENCES public.rp_campaign_factions(id) ON DELETE CASCADE,
  faction_b_id UUID NOT NULL REFERENCES public.rp_campaign_factions(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'neutral', -- allied, neutral, hostile
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_factions CHECK (faction_a_id <> faction_b_id)
);

-- Per-session faction standing for characters (campaign-specific)
CREATE TABLE public.rp_character_faction_standing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  campaign_faction_id UUID NOT NULL REFERENCES public.rp_campaign_factions(id) ON DELETE CASCADE,
  reputation_score INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'neutral',
  is_member BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ,
  betrayed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, character_id, campaign_faction_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_random_events_campaign ON public.rp_random_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_random_event_log_session ON public.rp_random_event_log(session_id);
CREATE INDEX IF NOT EXISTS idx_interaction_points_campaign ON public.rp_interaction_points(campaign_id);
CREATE INDEX IF NOT EXISTS idx_interaction_log_session ON public.rp_interaction_log(session_id);
CREATE INDEX IF NOT EXISTS idx_entry_points_campaign ON public.rp_campaign_entry_points(campaign_id);
CREATE INDEX IF NOT EXISTS idx_convergence_nodes_campaign ON public.rp_convergence_nodes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_factions_campaign ON public.rp_campaign_factions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_faction_standing_session ON public.rp_character_faction_standing(session_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.rp_random_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_random_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_interaction_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_interaction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_interaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_campaign_entry_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_convergence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_convergence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_campaign_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_faction_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_character_faction_standing ENABLE ROW LEVEL SECURITY;

-- Random Events: Anyone can read published campaigns' events, authors can manage
CREATE POLICY "Anyone can view random events" ON public.rp_random_events FOR SELECT USING (true);
CREATE POLICY "Authors can manage random events" ON public.rp_random_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns c WHERE c.id = campaign_id AND c.author_id = auth.uid())
);

-- Random Event Log: Participants can view their session's log
CREATE POLICY "Session participants can view event log" ON public.rp_random_event_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rp_session_participants sp WHERE sp.session_id = rp_random_event_log.session_id 
    AND sp.character_id IN (SELECT id FROM public.rp_characters WHERE user_id = auth.uid()))
);
CREATE POLICY "System can insert event log" ON public.rp_random_event_log FOR INSERT WITH CHECK (true);

-- Interaction Points: Anyone can read, authors manage
CREATE POLICY "Anyone can view interaction points" ON public.rp_interaction_points FOR SELECT USING (true);
CREATE POLICY "Authors can manage interaction points" ON public.rp_interaction_points FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns c WHERE c.id = campaign_id AND c.author_id = auth.uid())
);

-- Interaction Outcomes: Anyone can read, authors manage
CREATE POLICY "Anyone can view interaction outcomes" ON public.rp_interaction_outcomes FOR SELECT USING (true);
CREATE POLICY "Authors can manage interaction outcomes" ON public.rp_interaction_outcomes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_interaction_points ip 
    JOIN public.rp_campaigns c ON c.id = ip.campaign_id 
    WHERE ip.id = interaction_id AND c.author_id = auth.uid())
);

-- Interaction Log: Participants can view and insert
CREATE POLICY "Session participants can view interaction log" ON public.rp_interaction_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rp_session_participants sp WHERE sp.session_id = rp_interaction_log.session_id 
    AND sp.character_id IN (SELECT id FROM public.rp_characters WHERE user_id = auth.uid()))
);
CREATE POLICY "Session participants can insert interaction log" ON public.rp_interaction_log FOR INSERT WITH CHECK (true);

-- Entry Points: Anyone can read, authors manage
CREATE POLICY "Anyone can view entry points" ON public.rp_campaign_entry_points FOR SELECT USING (true);
CREATE POLICY "Authors can manage entry points" ON public.rp_campaign_entry_points FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns c WHERE c.id = campaign_id AND c.author_id = auth.uid())
);

-- Convergence Nodes: Anyone can read, authors manage
CREATE POLICY "Anyone can view convergence nodes" ON public.rp_convergence_nodes FOR SELECT USING (true);
CREATE POLICY "Authors can manage convergence nodes" ON public.rp_convergence_nodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns c WHERE c.id = campaign_id AND c.author_id = auth.uid())
);

-- Convergence Rules: Anyone can read, authors manage
CREATE POLICY "Anyone can view convergence rules" ON public.rp_convergence_rules FOR SELECT USING (true);
CREATE POLICY "Authors can manage convergence rules" ON public.rp_convergence_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_convergence_nodes cn 
    JOIN public.rp_campaigns c ON c.id = cn.campaign_id 
    WHERE cn.id = convergence_id AND c.author_id = auth.uid())
);

-- Campaign Factions: Anyone can read, authors manage
CREATE POLICY "Anyone can view campaign factions" ON public.rp_campaign_factions FOR SELECT USING (true);
CREATE POLICY "Authors can manage campaign factions" ON public.rp_campaign_factions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns c WHERE c.id = campaign_id AND c.author_id = auth.uid())
);

-- Faction Relations: Anyone can read, authors manage
CREATE POLICY "Anyone can view faction relations" ON public.rp_faction_relations FOR SELECT USING (true);
CREATE POLICY "Authors can manage faction relations" ON public.rp_faction_relations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns c WHERE c.id = campaign_id AND c.author_id = auth.uid())
);

-- Character Faction Standing: Users can view/manage their own characters
CREATE POLICY "Users can view own faction standing" ON public.rp_character_faction_standing FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rp_characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can manage own faction standing" ON public.rp_character_faction_standing FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_random_events_updated_at
  BEFORE UPDATE ON public.rp_random_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interaction_points_updated_at
  BEFORE UPDATE ON public.rp_interaction_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_factions_updated_at
  BEFORE UPDATE ON public.rp_campaign_factions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faction_standing_updated_at
  BEFORE UPDATE ON public.rp_character_faction_standing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();