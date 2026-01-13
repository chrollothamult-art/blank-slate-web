-- Make book-files bucket public so PDFs can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE name = 'book-files';