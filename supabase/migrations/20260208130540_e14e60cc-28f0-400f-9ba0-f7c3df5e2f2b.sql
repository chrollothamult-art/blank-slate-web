
-- Add missing columns to rp_items
ALTER TABLE public.rp_items ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.rp_campaigns(id) ON DELETE CASCADE;
ALTER TABLE public.rp_items ADD COLUMN IF NOT EXISTS icon_emoji TEXT DEFAULT '📦';
ALTER TABLE public.rp_items ADD COLUMN IF NOT EXISTS is_consumable BOOLEAN DEFAULT false;
ALTER TABLE public.rp_items ADD COLUMN IF NOT EXISTS is_quest_item BOOLEAN DEFAULT false;
ALTER TABLE public.rp_items ADD COLUMN IF NOT EXISTS stat_bonus JSONB DEFAULT NULL;

-- Add inventory_slots to rp_characters
ALTER TABLE public.rp_characters ADD COLUMN IF NOT EXISTS inventory_slots INTEGER NOT NULL DEFAULT 10;

-- Add source_session_id to rp_character_inventory if missing
ALTER TABLE public.rp_character_inventory ADD COLUMN IF NOT EXISTS source_session_id UUID REFERENCES public.rp_sessions(id) ON DELETE SET NULL;

-- Enable RLS on both tables
ALTER TABLE public.rp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_character_inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$
BEGIN
  -- rp_items policies
  DROP POLICY IF EXISTS "Anyone can view items" ON public.rp_items;
  DROP POLICY IF EXISTS "Campaign authors can manage items" ON public.rp_items;
  DROP POLICY IF EXISTS "Campaign authors can update items" ON public.rp_items;
  DROP POLICY IF EXISTS "Campaign authors can delete items" ON public.rp_items;
  
  -- rp_character_inventory policies
  DROP POLICY IF EXISTS "Users can view own character inventory" ON public.rp_character_inventory;
  DROP POLICY IF EXISTS "Users can manage own character inventory" ON public.rp_character_inventory;
  DROP POLICY IF EXISTS "Users can update own character inventory" ON public.rp_character_inventory;
  DROP POLICY IF EXISTS "Users can delete own character inventory" ON public.rp_character_inventory;
END $$;

-- RLS Policies for rp_items
CREATE POLICY "Anyone can view items" ON public.rp_items
  FOR SELECT USING (true);

CREATE POLICY "Campaign authors can manage items" ON public.rp_items
  FOR INSERT WITH CHECK (
    campaign_id IS NULL OR EXISTS (
      SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Campaign authors can update items" ON public.rp_items
  FOR UPDATE USING (
    campaign_id IS NULL OR EXISTS (
      SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Campaign authors can delete items" ON public.rp_items
  FOR DELETE USING (
    campaign_id IS NULL OR EXISTS (
      SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid()
    )
  );

-- RLS Policies for rp_character_inventory
CREATE POLICY "Users can view own character inventory" ON public.rp_character_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage own character inventory" ON public.rp_character_inventory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own character inventory" ON public.rp_character_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own character inventory" ON public.rp_character_inventory
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.rp_characters WHERE id = character_id AND user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rp_character_inventory_character ON public.rp_character_inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_rp_items_campaign ON public.rp_items(campaign_id);
