-- Add permadeath mode to campaigns
ALTER TABLE public.rp_campaigns 
ADD COLUMN IF NOT EXISTS permadeath BOOLEAN NOT NULL DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.rp_campaigns.permadeath IS 'When true, character is permanently deleted on death (hardcore mode)';