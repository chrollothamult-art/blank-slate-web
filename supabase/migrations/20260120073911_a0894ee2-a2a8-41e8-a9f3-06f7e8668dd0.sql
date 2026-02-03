-- Create character_stats table for character comparison feature
CREATE TABLE public.character_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.almanac_characters(id) ON DELETE CASCADE,
  strength INTEGER DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
  intelligence INTEGER DEFAULT 50 CHECK (intelligence >= 0 AND intelligence <= 100),
  agility INTEGER DEFAULT 50 CHECK (agility >= 0 AND agility <= 100),
  magic INTEGER DEFAULT 50 CHECK (magic >= 0 AND magic <= 100),
  charisma INTEGER DEFAULT 50 CHECK (charisma >= 0 AND charisma <= 100),
  endurance INTEGER DEFAULT 50 CHECK (endurance >= 0 AND endurance <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(character_id)
);

-- Create world_locations table for interactive map feature
CREATE TABLE public.world_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'city' CHECK (type IN ('kingdom', 'city', 'landmark', 'region')),
  description TEXT,
  x_position NUMERIC NOT NULL DEFAULT 50 CHECK (x_position >= 0 AND x_position <= 100),
  y_position NUMERIC NOT NULL DEFAULT 50 CHECK (y_position >= 0 AND y_position <= 100),
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add origin_location_id to almanac_characters for map linking
ALTER TABLE public.almanac_characters 
ADD COLUMN IF NOT EXISTS origin_location_id UUID REFERENCES public.world_locations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_locations ENABLE ROW LEVEL SECURITY;

-- Public read access for character stats (everyone can view)
CREATE POLICY "Character stats are viewable by everyone"
ON public.character_stats FOR SELECT
USING (true);

-- Admin write access for character stats
CREATE POLICY "Admins can manage character stats"
ON public.character_stats FOR ALL
USING (true)
WITH CHECK (true);

-- Public read access for world locations (everyone can view)
CREATE POLICY "World locations are viewable by everyone"
ON public.world_locations FOR SELECT
USING (true);

-- Admin write access for world locations
CREATE POLICY "Admins can manage world locations"
ON public.world_locations FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger for character_stats
CREATE TRIGGER update_character_stats_updated_at
BEFORE UPDATE ON public.character_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for world_locations
CREATE TRIGGER update_world_locations_updated_at
BEFORE UPDATE ON public.world_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();