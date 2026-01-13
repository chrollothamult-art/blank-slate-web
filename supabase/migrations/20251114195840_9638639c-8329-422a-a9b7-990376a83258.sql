-- Add foreign key relationship between forum_replies and profiles
ALTER TABLE public.forum_replies 
ADD CONSTRAINT forum_replies_author_id_profiles_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;