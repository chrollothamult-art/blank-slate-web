-- Migration: Create rp_custom_factions table for Custom Universe mode
-- Run this in the Supabase Dashboard SQL Editor

-- Create the rp_custom_factions table
CREATE TABLE IF NOT EXISTS public.rp_custom_factions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  image_url TEXT,
  ranks JSONB DEFAULT '[]'::JSONB,
  perks JSONB DEFAULT '{}'::JSONB,
  conflicts TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for campaign lookup
CREATE INDEX IF NOT EXISTS idx_rp_custom_factions_campaign_id ON public.rp_custom_factions(campaign_id);

-- Enable RLS
ALTER TABLE public.rp_custom_factions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view factions for published campaigns
CREATE POLICY "Anyone can view factions for published campaigns"
ON public.rp_custom_factions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rp_campaigns c
    WHERE c.id = campaign_id AND c.is_published = true
  )
);

-- Policy: Campaign authors can manage their factions
CREATE POLICY "Authors can manage their campaign factions"
ON public.rp_custom_factions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.rp_campaigns c
    WHERE c.id = campaign_id AND c.author_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_rp_custom_factions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rp_custom_factions_updated_at ON public.rp_custom_factions;
CREATE TRIGGER trigger_rp_custom_factions_updated_at
  BEFORE UPDATE ON public.rp_custom_factions
  FOR EACH ROW
  EXECUTE FUNCTION update_rp_custom_factions_updated_at();

-- Grant permissions
GRANT SELECT ON public.rp_custom_factions TO anon;
GRANT ALL ON public.rp_custom_factions TO authenticated;
