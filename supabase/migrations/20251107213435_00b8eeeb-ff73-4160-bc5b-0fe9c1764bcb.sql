-- Create missing profile for existing user
INSERT INTO public.profiles (id, username, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'full_name', '')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Now add the foreign key from forum_posts to profiles
ALTER TABLE public.forum_posts
ADD CONSTRAINT forum_posts_author_id_profiles_fkey
FOREIGN KEY (author_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;