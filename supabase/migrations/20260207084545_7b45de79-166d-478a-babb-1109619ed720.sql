-- Campaign Reviews & Ratings
CREATE TABLE public.rp_campaign_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.rp_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Add average rating and review count to campaigns
ALTER TABLE public.rp_campaigns 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Enable RLS on reviews
ALTER TABLE public.rp_campaign_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are readable by everyone
CREATE POLICY "Reviews are viewable by everyone" 
ON public.rp_campaign_reviews 
FOR SELECT 
USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create their own reviews" 
ON public.rp_campaign_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
ON public.rp_campaign_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
ON public.rp_campaign_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add is_public column to rp_characters for character showcase
ALTER TABLE public.rp_characters 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create policy to allow viewing public characters
CREATE POLICY "Public characters are viewable by everyone" 
ON public.rp_characters 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- Community Lore Almanac table for approved community entries
CREATE TABLE public.rp_community_lore (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES public.rp_lore_proposals(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  article TEXT,
  image_url TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rp_community_lore ENABLE ROW LEVEL SECURITY;

-- Community lore is readable by everyone
CREATE POLICY "Community lore is viewable by everyone" 
ON public.rp_community_lore 
FOR SELECT 
USING (true);

-- Only loremasters can insert/update/delete community lore
CREATE POLICY "Loremasters can manage community lore" 
ON public.rp_community_lore 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.rp_loremasters WHERE user_id = auth.uid()
  )
);

-- Function to update campaign rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_campaign_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.rp_campaigns
    SET 
      average_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1) 
        FROM public.rp_campaign_reviews 
        WHERE campaign_id = OLD.campaign_id
      ), 0),
      review_count = (
        SELECT COUNT(*) 
        FROM public.rp_campaign_reviews 
        WHERE campaign_id = OLD.campaign_id
      )
    WHERE id = OLD.campaign_id;
    RETURN OLD;
  ELSE
    UPDATE public.rp_campaigns
    SET 
      average_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1) 
        FROM public.rp_campaign_reviews 
        WHERE campaign_id = NEW.campaign_id
      ), 0),
      review_count = (
        SELECT COUNT(*) 
        FROM public.rp_campaign_reviews 
        WHERE campaign_id = NEW.campaign_id
      )
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic rating updates
CREATE TRIGGER update_campaign_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.rp_campaign_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_rating();

-- Add contributor badge tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lore_contributions INTEGER DEFAULT 0;

-- Function to increment contributor count when proposal is approved
CREATE OR REPLACE FUNCTION public.increment_lore_contributions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET lore_contributions = lore_contributions + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on lore proposals
CREATE TRIGGER increment_lore_contributions_trigger
AFTER UPDATE ON public.rp_lore_proposals
FOR EACH ROW
EXECUTE FUNCTION public.increment_lore_contributions();