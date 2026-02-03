-- Create table for external book purchase links
CREATE TABLE public.book_external_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  format_type TEXT NOT NULL, -- e.g., 'ebook', 'paperback', 'hardcover', 'audiobook'
  store_name TEXT NOT NULL, -- e.g., 'Amazon', 'Barnes & Noble', 'Kobo'
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_external_links ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view external book links"
ON public.book_external_links
FOR SELECT
USING (true);

-- Create policy for admin insert/update/delete (assuming admin manages via service role or specific logic)
CREATE POLICY "Service role can manage external book links"
ON public.book_external_links
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_book_external_links_book_id ON public.book_external_links(book_id);

-- Create trigger for updated_at
CREATE TRIGGER update_book_external_links_updated_at
BEFORE UPDATE ON public.book_external_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();