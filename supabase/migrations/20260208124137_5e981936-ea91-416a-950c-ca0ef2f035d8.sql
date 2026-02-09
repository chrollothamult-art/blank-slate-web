
-- Phase 10: Custom World Builder tables

-- Campaign universe settings
CREATE TABLE public.rp_campaign_universe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'thouart' CHECK (mode IN ('thouart', 'original')),
  world_name TEXT,
  world_description TEXT,
  rules_document TEXT,
  custom_stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id)
);

-- Custom races
CREATE TABLE public.rp_custom_races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stat_bonuses JSONB DEFAULT '{}',
  image_url TEXT,
  lore TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom magic systems
CREATE TABLE public.rp_custom_magic (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  magic_type TEXT,
  rules TEXT,
  casting_cost JSONB DEFAULT '{}',
  effects JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom beliefs/religions
CREATE TABLE public.rp_custom_beliefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deity_name TEXT,
  description TEXT,
  rituals JSONB DEFAULT '[]',
  divine_powers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom items
CREATE TABLE public.rp_custom_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_type TEXT DEFAULT 'misc',
  description TEXT,
  effects JSONB DEFAULT '{}',
  rarity TEXT DEFAULT 'common',
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rp_campaign_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_custom_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_custom_magic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_custom_beliefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_custom_items ENABLE ROW LEVEL SECURITY;

-- RLS policies: anyone can read, only campaign author can write
-- rp_campaign_universe
CREATE POLICY "Anyone can view campaign universe settings" ON public.rp_campaign_universe FOR SELECT USING (true);
CREATE POLICY "Campaign author can insert universe settings" ON public.rp_campaign_universe FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can update universe settings" ON public.rp_campaign_universe FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can delete universe settings" ON public.rp_campaign_universe FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- rp_custom_races
CREATE POLICY "Anyone can view custom races" ON public.rp_custom_races FOR SELECT USING (true);
CREATE POLICY "Campaign author can insert custom races" ON public.rp_custom_races FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can update custom races" ON public.rp_custom_races FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can delete custom races" ON public.rp_custom_races FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- rp_custom_magic
CREATE POLICY "Anyone can view custom magic" ON public.rp_custom_magic FOR SELECT USING (true);
CREATE POLICY "Campaign author can insert custom magic" ON public.rp_custom_magic FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can update custom magic" ON public.rp_custom_magic FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can delete custom magic" ON public.rp_custom_magic FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- rp_custom_beliefs
CREATE POLICY "Anyone can view custom beliefs" ON public.rp_custom_beliefs FOR SELECT USING (true);
CREATE POLICY "Campaign author can insert custom beliefs" ON public.rp_custom_beliefs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can update custom beliefs" ON public.rp_custom_beliefs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can delete custom beliefs" ON public.rp_custom_beliefs FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- rp_custom_items
CREATE POLICY "Anyone can view custom items" ON public.rp_custom_items FOR SELECT USING (true);
CREATE POLICY "Campaign author can insert custom items" ON public.rp_custom_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can update custom items" ON public.rp_custom_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);
CREATE POLICY "Campaign author can delete custom items" ON public.rp_custom_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rp_campaigns WHERE id = campaign_id AND author_id = auth.uid())
);

-- Triggers for updated_at
CREATE TRIGGER update_rp_campaign_universe_updated_at BEFORE UPDATE ON public.rp_campaign_universe FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rp_custom_races_updated_at BEFORE UPDATE ON public.rp_custom_races FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rp_custom_magic_updated_at BEFORE UPDATE ON public.rp_custom_magic FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rp_custom_beliefs_updated_at BEFORE UPDATE ON public.rp_custom_beliefs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rp_custom_items_updated_at BEFORE UPDATE ON public.rp_custom_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
