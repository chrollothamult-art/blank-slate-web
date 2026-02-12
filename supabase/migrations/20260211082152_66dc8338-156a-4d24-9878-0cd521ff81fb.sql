
-- 1. Cross-Campaign Inventory Persistence: add is_persistent flag to items
ALTER TABLE public.rp_items ADD COLUMN IF NOT EXISTS is_persistent boolean NOT NULL DEFAULT false;

-- 2. Item Crafting System
CREATE TABLE public.rp_crafting_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  result_item_id UUID NOT NULL REFERENCES public.rp_items(id) ON DELETE CASCADE,
  result_quantity INTEGER NOT NULL DEFAULT 1,
  required_stat TEXT,
  required_stat_value INTEGER,
  crafting_time_turns INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.rp_crafting_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.rp_crafting_recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.rp_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.rp_crafting_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_crafting_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crafting recipes" ON public.rp_crafting_recipes FOR SELECT USING (true);
CREATE POLICY "Campaign authors can manage recipes" ON public.rp_crafting_recipes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

CREATE POLICY "Anyone can view crafting ingredients" ON public.rp_crafting_ingredients FOR SELECT USING (true);
CREATE POLICY "Recipe authors can manage ingredients" ON public.rp_crafting_ingredients FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.rp_crafting_recipes r 
    JOIN public.rp_campaigns c ON c.id = r.campaign_id 
    WHERE r.id = recipe_id AND c.author_id = auth.uid()
  )
);

-- 3. Loot Tables
CREATE TABLE public.rp_loot_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.rp_story_nodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_drops INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.rp_loot_table_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loot_table_id UUID NOT NULL REFERENCES public.rp_loot_tables(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.rp_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  drop_chance NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  min_level INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.rp_loot_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_loot_table_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loot tables" ON public.rp_loot_tables FOR SELECT USING (true);
CREATE POLICY "Campaign authors can manage loot tables" ON public.rp_loot_tables FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

CREATE POLICY "Anyone can view loot entries" ON public.rp_loot_table_entries FOR SELECT USING (true);
CREATE POLICY "Loot table authors can manage entries" ON public.rp_loot_table_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.rp_loot_tables lt 
    JOIN public.rp_campaigns c ON c.id = lt.campaign_id 
    WHERE lt.id = loot_table_id AND c.author_id = auth.uid()
  )
);
