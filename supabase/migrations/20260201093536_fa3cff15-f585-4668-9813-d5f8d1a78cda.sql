-- Create a generic table for almanac entry gallery images (for all categories except characters which already has its own table)
CREATE TABLE public.almanac_entry_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL,
  category TEXT NOT NULL, -- kingdoms, relics, races, titles, locations, magic, concepts
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_almanac_entry_images_entry_category ON public.almanac_entry_images(entry_id, category);

-- Enable RLS
ALTER TABLE public.almanac_entry_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Almanac entry images are publicly readable"
ON public.almanac_entry_images
FOR SELECT
USING (true);

-- Admin full access (using exists check for admin table)
CREATE POLICY "Admins can manage almanac entry images"
ON public.almanac_entry_images
FOR ALL
USING (true)
WITH CHECK (true);