-- Lore Chronicles Progression System (adding missing components)
-- Check and add tables/columns that don't exist yet

-- 1. Ability definitions (only if not exists)
CREATE TABLE IF NOT EXISTS public.rp_abilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '⚔️',
  ability_type TEXT NOT NULL DEFAULT 'passive',
  stat_bonus JSONB DEFAULT NULL,
  unlock_requirements JSONB DEFAULT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Faction definitions
CREATE TABLE IF NOT EXISTS public.rp_factions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  color TEXT DEFAULT '#6366f1',
  reputation_levels JSONB DEFAULT '{"hostile": -100, "unfriendly": -50, "neutral": 0, "friendly": 50, "honored": 100, "exalted": 200}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Character faction reputation
CREATE TABLE IF NOT EXISTS public.rp_character_factions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.rp_characters(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES public.rp_factions(id) ON DELETE CASCADE,
  reputation INTEGER NOT NULL DEFAULT 0,
  rank TEXT DEFAULT 'neutral',
  joined_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(character_id, faction_id)
);

-- 4. Level thresholds and benefits
CREATE TABLE IF NOT EXISTS public.rp_level_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  xp_required INTEGER NOT NULL,
  stat_points_granted INTEGER NOT NULL DEFAULT 1,
  ability_slots_granted INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  description TEXT
);

-- Add ability_slots and title columns to rp_characters if they don't exist
ALTER TABLE public.rp_characters 
ADD COLUMN IF NOT EXISTS ability_slots INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;

-- Add missing columns to rp_character_abilities if needed
ALTER TABLE public.rp_character_abilities
ADD COLUMN IF NOT EXISTS source_session_id UUID REFERENCES public.rp_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL;

-- Insert level thresholds only if table is empty
INSERT INTO public.rp_level_benefits (level, xp_required, stat_points_granted, ability_slots_granted, title, description)
SELECT * FROM (VALUES
  (1, 0, 0, 3, 'Novice', 'Your journey begins'),
  (2, 100, 1, 0, NULL, 'Gaining experience'),
  (3, 250, 1, 0, NULL, 'Learning the ways'),
  (4, 450, 1, 0, NULL, 'Growing stronger'),
  (5, 700, 2, 1, 'Apprentice', 'You show promise'),
  (6, 1000, 1, 0, NULL, 'Honing your skills'),
  (7, 1400, 1, 0, NULL, 'Becoming capable'),
  (8, 1900, 1, 0, NULL, 'Facing challenges'),
  (9, 2500, 1, 0, NULL, 'Proving yourself'),
  (10, 3200, 2, 1, 'Journeyman', 'A true adventurer'),
  (11, 4000, 1, 0, NULL, 'Walking the path'),
  (12, 4900, 1, 0, NULL, 'Building reputation'),
  (13, 5900, 1, 0, NULL, 'Gaining renown'),
  (14, 7000, 1, 0, NULL, 'A name to remember'),
  (15, 8200, 2, 1, 'Adept', 'Mastery approaches'),
  (16, 9500, 1, 0, NULL, 'Power increases'),
  (17, 10900, 1, 0, NULL, 'Legend forms'),
  (18, 12400, 1, 0, NULL, 'Stories spread'),
  (19, 14000, 1, 0, NULL, 'Almost legendary'),
  (20, 15700, 3, 2, 'Champion', 'A true champion of the realm')
) AS v(level, xp_required, stat_points_granted, ability_slots_granted, title, description)
WHERE NOT EXISTS (SELECT 1 FROM public.rp_level_benefits LIMIT 1);

-- Insert sample abilities only if table is empty
INSERT INTO public.rp_abilities (name, description, icon, ability_type, stat_bonus, rarity)
SELECT * FROM (VALUES
  ('Ironclad Will', 'Your mental fortitude grants +1 Wisdom in stat checks', '🛡️', 'passive', '{"wisdom": 1}'::jsonb, 'common'),
  ('Silver Tongue', 'Your persuasive abilities grant +1 Charisma', '💬', 'passive', '{"charisma": 1}'::jsonb, 'common'),
  ('Swift Reflexes', 'Your quick reactions grant +1 Agility', '⚡', 'passive', '{"agility": 1}'::jsonb, 'common'),
  ('Arcane Insight', 'Your magical knowledge grants +1 Magic', '✨', 'passive', '{"magic": 1}'::jsonb, 'common'),
  ('Brute Force', 'Your raw power grants +1 Strength', '💪', 'passive', '{"strength": 1}'::jsonb, 'common'),
  ('Tactician', 'Bonus to all combat-related choices', '🎯', 'active', NULL::jsonb, 'rare'),
  ('Diplomat', 'Unlock alternative peaceful resolutions', '🕊️', 'active', NULL::jsonb, 'rare'),
  ('Lorekeeper', 'Access to hidden lore and secrets', '📚', 'active', NULL::jsonb, 'rare'),
  ('Shadow Step', '+2 Agility when evading danger', '🌙', 'stat_boost', '{"agility": 2}'::jsonb, 'epic'),
  ('Dragon Heart', '+2 Strength and +1 Charisma', '🐉', 'stat_boost', '{"strength": 2, "charisma": 1}'::jsonb, 'legendary')
) AS v(name, description, icon, ability_type, stat_bonus, rarity)
WHERE NOT EXISTS (SELECT 1 FROM public.rp_abilities LIMIT 1);

-- Insert sample factions only if table is empty
INSERT INTO public.rp_factions (name, description, color)
SELECT * FROM (VALUES
  ('The Seekers of Truth', 'Scholars and mages dedicated to uncovering ancient knowledge', '#6366f1'),
  ('Iron Brotherhood', 'Warriors bound by honor and the call of battle', '#dc2626'),
  ('Shadow Syndicate', 'A secretive network operating in the darkness', '#1f2937'),
  ('Order of the Dawn', 'Protectors of the realm against dark forces', '#eab308'),
  ('Merchant Coalition', 'Trade guilds united for prosperity', '#059669')
) AS v(name, description, color)
WHERE NOT EXISTS (SELECT 1 FROM public.rp_factions LIMIT 1);

-- Enable RLS (idempotent)
ALTER TABLE public.rp_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_character_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_level_benefits ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist and recreate
DROP POLICY IF EXISTS "Anyone can view abilities" ON public.rp_abilities;
DROP POLICY IF EXISTS "Admins can manage abilities" ON public.rp_abilities;
CREATE POLICY "Anyone can view abilities" ON public.rp_abilities FOR SELECT USING (true);
CREATE POLICY "Admins can manage abilities" ON public.rp_abilities FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Anyone can view factions" ON public.rp_factions;
DROP POLICY IF EXISTS "Admins can manage factions" ON public.rp_factions;
CREATE POLICY "Anyone can view factions" ON public.rp_factions FOR SELECT USING (true);
CREATE POLICY "Admins can manage factions" ON public.rp_factions FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own character factions" ON public.rp_character_factions;
DROP POLICY IF EXISTS "Users can manage own character factions" ON public.rp_character_factions;
CREATE POLICY "Users can view own character factions" ON public.rp_character_factions FOR SELECT
  USING (EXISTS (SELECT 1 FROM rp_characters WHERE id = character_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage own character factions" ON public.rp_character_factions FOR ALL
  USING (EXISTS (SELECT 1 FROM rp_characters WHERE id = character_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM rp_characters WHERE id = character_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view level benefits" ON public.rp_level_benefits;
CREATE POLICY "Anyone can view level benefits" ON public.rp_level_benefits FOR SELECT USING (true);

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT level FROM rp_level_benefits WHERE xp_required <= xp_amount ORDER BY level DESC LIMIT 1),
    1
  );
$$;

CREATE OR REPLACE FUNCTION public.get_xp_for_next_level(current_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT xp_required FROM rp_level_benefits WHERE xp_required > current_xp ORDER BY level ASC LIMIT 1),
    current_xp
  );
$$;