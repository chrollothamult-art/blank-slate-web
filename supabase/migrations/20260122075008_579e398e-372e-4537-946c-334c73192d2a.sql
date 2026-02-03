-- Add is_disabled, promo fields to all almanac tables

-- Kingdoms
ALTER TABLE public.almanac_kingdoms 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Relics
ALTER TABLE public.almanac_relics 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Races
ALTER TABLE public.almanac_races 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Titles
ALTER TABLE public.almanac_titles 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Locations
ALTER TABLE public.almanac_locations 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Magic
ALTER TABLE public.almanac_magic 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Concepts
ALTER TABLE public.almanac_concepts 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

-- Characters
ALTER TABLE public.almanac_characters 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text text,
ADD COLUMN IF NOT EXISTS promo_link text,
ADD COLUMN IF NOT EXISTS promo_book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;