-- Add PDF fields to books table for ebook and preview files
ALTER TABLE public.books 
ADD COLUMN ebook_pdf_url text,
ADD COLUMN preview_pdf_url text;

-- Create index for faster queries
CREATE INDEX idx_books_ebook_pdf ON public.books(ebook_pdf_url) WHERE ebook_pdf_url IS NOT NULL;
CREATE INDEX idx_books_preview_pdf ON public.books(preview_pdf_url) WHERE preview_pdf_url IS NOT NULL;