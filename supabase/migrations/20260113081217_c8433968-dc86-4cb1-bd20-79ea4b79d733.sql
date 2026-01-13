-- Create almanac_characters table for character lore and biography
CREATE TABLE public.almanac_characters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    article TEXT NOT NULL,
    image_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    -- Biography fields
    age TEXT,
    race TEXT,
    nationality TEXT,
    magic_classification TEXT,
    -- Lore field (character article)
    lore TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.almanac_characters ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (almanac is public lore)
CREATE POLICY "Anyone can view characters" 
ON public.almanac_characters 
FOR SELECT 
USING (true);

-- Create policy for authenticated admin insert (we'll use localStorage check in app for now)
CREATE POLICY "Authenticated users can insert characters" 
ON public.almanac_characters 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated admin update
CREATE POLICY "Authenticated users can update characters" 
ON public.almanac_characters 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated admin delete
CREATE POLICY "Authenticated users can delete characters" 
ON public.almanac_characters 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for almanac_characters
CREATE TRIGGER update_almanac_characters_updated_at
BEFORE UPDATE ON public.almanac_characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();