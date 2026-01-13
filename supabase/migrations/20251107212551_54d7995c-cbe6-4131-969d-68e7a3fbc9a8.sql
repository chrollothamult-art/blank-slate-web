-- Create forum_posts table
CREATE TABLE public.forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  is_sticky boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  replies_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum_replies table
CREATE TABLE public.forum_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum_likes table
CREATE TABLE public.forum_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_posts
CREATE POLICY "Anyone can view posts"
ON public.forum_posts
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON public.forum_posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
ON public.forum_posts
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
ON public.forum_posts
FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts"
ON public.forum_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for forum_replies
CREATE POLICY "Anyone can view replies"
ON public.forum_replies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.forum_replies
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own replies"
ON public.forum_replies
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own replies"
ON public.forum_replies
FOR DELETE
USING (auth.uid() = author_id);

-- RLS Policies for forum_likes
CREATE POLICY "Anyone can view likes"
ON public.forum_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like posts"
ON public.forum_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.forum_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_likes_count
AFTER INSERT OR DELETE ON public.forum_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Create trigger to update replies_count
CREATE OR REPLACE FUNCTION public.update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts
    SET replies_count = replies_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts
    SET replies_count = replies_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_replies_count
AFTER INSERT OR DELETE ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_post_replies_count();

-- Create trigger for updated_at on forum_posts
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on forum_replies
CREATE TRIGGER update_forum_replies_updated_at
BEFORE UPDATE ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();