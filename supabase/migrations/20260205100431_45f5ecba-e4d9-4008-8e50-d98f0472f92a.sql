-- =============================================
-- LORE CHRONICLES - ROLEPLAY SYSTEM SCHEMA
-- =============================================

-- 1. Core Character Table
CREATE TABLE public.rp_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  race_id UUID REFERENCES public.almanac_races(id),
  stats JSONB NOT NULL DEFAULT '{"strength": 3, "magic": 3, "charisma": 3, "wisdom": 3, "agility": 3}'::jsonb,
  backstory TEXT,
  portrait_url TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Character Abilities (unlocked through story progression)
CREATE TABLE public.rp_character_abilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  ability_name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_node_id UUID,
  UNIQUE(character_id, ability_name)
);

-- 3. Items Definition
CREATE TABLE public.rp_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'misc',
  effect JSONB DEFAULT '{}'::jsonb,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Character Inventory
CREATE TABLE public.rp_character_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.rp_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_node_id UUID,
  UNIQUE(character_id, item_id)
);

-- 5. Campaigns (user-created adventures)
CREATE TABLE public.rp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  genre TEXT NOT NULL DEFAULT 'adventure',
  difficulty TEXT NOT NULL DEFAULT 'normal',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  start_node_id UUID,
  estimated_duration INTEGER, -- in minutes
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Story Nodes (branching choice points)
CREATE TABLE public.rp_story_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'narrative',
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  audio_url TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for start_node after rp_story_nodes exists
ALTER TABLE public.rp_campaigns 
  ADD CONSTRAINT rp_campaigns_start_node_fkey 
  FOREIGN KEY (start_node_id) REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL;

-- 7. Node Choices (available options at each node)
CREATE TABLE public.rp_node_choices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES public.rp_story_nodes(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  target_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  stat_requirement JSONB, -- e.g., {"stat": "charisma", "min_value": 4}
  stat_effect JSONB, -- e.g., {"charisma": 1} or {"unlock_ability": "persuasion"}
  item_requirement UUID REFERENCES public.rp_items(id),
  item_reward UUID REFERENCES public.rp_items(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Sessions (active playthroughs)
CREATE TABLE public.rp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'solo',
  status TEXT NOT NULL DEFAULT 'active',
  current_node_id UUID REFERENCES public.rp_story_nodes(id),
  story_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Update character foreign key to sessions
ALTER TABLE public.rp_characters 
  ADD CONSTRAINT rp_characters_session_fkey 
  FOREIGN KEY (current_session_id) REFERENCES public.rp_sessions(id) ON DELETE SET NULL;

-- 9. Session Participants (for group sessions)
CREATE TABLE public.rp_session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(session_id, character_id)
);

-- 10. Character Progress (per-character session state)
CREATE TABLE public.rp_character_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.rp_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  current_node_id UUID REFERENCES public.rp_story_nodes(id),
  story_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  stats_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  nodes_visited UUID[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, character_id)
);

-- 11. Lore Proposals (user-submitted new lore)
CREATE TABLE public.rp_lore_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- race, location, item, faction, etc.
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Loremasters (users with oversight permissions)
CREATE TABLE public.rp_loremasters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  appointed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  appointed_by UUID REFERENCES auth.users(id)
);

-- 13. Campaign NPCs
CREATE TABLE public.rp_campaign_npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  portrait_url TEXT,
  expressions JSONB DEFAULT '{"neutral": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 14. Node Media (images, audio attached to nodes)
CREATE TABLE public.rp_node_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES public.rp_story_nodes(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- image, audio
  url TEXT NOT NULL,
  position TEXT DEFAULT 'background',
  should_loop BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.rp_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_character_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_character_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_node_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_character_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_lore_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_loremasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_campaign_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_node_media ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Characters: Users can manage their own characters
CREATE POLICY "Users can view their own characters" ON public.rp_characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own characters" ON public.rp_characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters" ON public.rp_characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters" ON public.rp_characters FOR DELETE USING (auth.uid() = user_id);

-- Character Abilities: Users can view/manage abilities for their characters
CREATE POLICY "Users can view their character abilities" ON public.rp_character_abilities FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their character abilities" ON public.rp_character_abilities FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));

-- Items: Everyone can view items
CREATE POLICY "Anyone can view items" ON public.rp_items FOR SELECT USING (true);

-- Character Inventory: Users manage their own
CREATE POLICY "Users can view their inventory" ON public.rp_character_inventory FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their inventory" ON public.rp_character_inventory FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));

-- Campaigns: Authors manage, everyone sees published
CREATE POLICY "Anyone can view published campaigns" ON public.rp_campaigns FOR SELECT 
  USING (is_published = true OR author_id = auth.uid());
CREATE POLICY "Users can create campaigns" ON public.rp_campaigns FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their campaigns" ON public.rp_campaigns FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their campaigns" ON public.rp_campaigns FOR DELETE USING (auth.uid() = author_id);

-- Story Nodes: Visible if campaign is published or user is author
CREATE POLICY "Users can view nodes of accessible campaigns" ON public.rp_story_nodes FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND (is_published = true OR author_id = auth.uid())));
CREATE POLICY "Authors can manage their campaign nodes" ON public.rp_story_nodes FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid()));

-- Node Choices: Same as nodes
CREATE POLICY "Users can view choices of accessible campaigns" ON public.rp_node_choices FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_story_nodes sn 
    JOIN public.rp_campaigns c ON sn.campaign_id = c.id 
    WHERE sn.id = node_id AND (c.is_published = true OR c.author_id = auth.uid())));
CREATE POLICY "Authors can manage choices" ON public.rp_node_choices FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_story_nodes sn 
    JOIN public.rp_campaigns c ON sn.campaign_id = c.id 
    WHERE sn.id = node_id AND c.author_id = auth.uid()));

-- Sessions: Users manage their own
CREATE POLICY "Users can view their sessions" ON public.rp_sessions FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can create sessions" ON public.rp_sessions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their sessions" ON public.rp_sessions FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their sessions" ON public.rp_sessions FOR DELETE USING (created_by = auth.uid());

-- Session Participants: Users can see sessions they're in
CREATE POLICY "Users can view their participations" ON public.rp_session_participants FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can join sessions" ON public.rp_session_participants FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can leave sessions" ON public.rp_session_participants FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));

-- Character Progress: Users manage their own character's progress
CREATE POLICY "Users can view their character progress" ON public.rp_character_progress FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their character progress" ON public.rp_character_progress FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid()));

-- Lore Proposals: Users manage their own, loremasters can see all
CREATE POLICY "Users can view their proposals" ON public.rp_lore_proposals FOR SELECT 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.rp_loremasters WHERE user_id = auth.uid()));
CREATE POLICY "Users can create proposals" ON public.rp_lore_proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update pending proposals" ON public.rp_lore_proposals FOR UPDATE 
  USING (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Loremasters can update proposals" ON public.rp_lore_proposals FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.rp_loremasters WHERE user_id = auth.uid()));

-- Loremasters: Anyone can see who's a loremaster
CREATE POLICY "Anyone can view loremasters" ON public.rp_loremasters FOR SELECT USING (true);

-- Campaign NPCs: Same as campaigns
CREATE POLICY "Users can view NPCs of accessible campaigns" ON public.rp_campaign_npcs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND (is_published = true OR author_id = auth.uid())));
CREATE POLICY "Authors can manage NPCs" ON public.rp_campaign_npcs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid()));

-- Node Media: Same as nodes
CREATE POLICY "Users can view media of accessible campaigns" ON public.rp_node_media FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rp_story_nodes sn 
    JOIN public.rp_campaigns c ON sn.campaign_id = c.id 
    WHERE sn.id = node_id AND (c.is_published = true OR c.author_id = auth.uid())));
CREATE POLICY "Authors can manage media" ON public.rp_node_media FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.rp_story_nodes sn 
    JOIN public.rp_campaigns c ON sn.campaign_id = c.id 
    WHERE sn.id = node_id AND c.author_id = auth.uid()));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_rp_characters_updated_at BEFORE UPDATE ON public.rp_characters 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rp_campaigns_updated_at BEFORE UPDATE ON public.rp_campaigns 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rp_story_nodes_updated_at BEFORE UPDATE ON public.rp_story_nodes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rp_character_progress_updated_at BEFORE UPDATE ON public.rp_character_progress 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rp_lore_proposals_updated_at BEFORE UPDATE ON public.rp_lore_proposals 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CREATE STORAGE BUCKET FOR CAMPAIGN ASSETS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('rp-campaign-assets', 'rp-campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for campaign assets
CREATE POLICY "Anyone can view campaign assets" ON storage.objects FOR SELECT 
  USING (bucket_id = 'rp-campaign-assets');

CREATE POLICY "Authenticated users can upload campaign assets" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'rp-campaign-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their campaign assets" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'rp-campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their campaign assets" ON storage.objects FOR DELETE 
  USING (bucket_id = 'rp-campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);