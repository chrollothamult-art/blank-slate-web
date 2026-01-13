-- Fix search_path for trigger functions
DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP FUNCTION IF EXISTS public.update_post_replies_count() CASCADE;
CREATE OR REPLACE FUNCTION public.update_post_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate triggers
DROP TRIGGER IF EXISTS update_likes_count ON public.forum_likes;
CREATE TRIGGER update_likes_count
AFTER INSERT OR DELETE ON public.forum_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

DROP TRIGGER IF EXISTS update_replies_count ON public.forum_replies;
CREATE TRIGGER update_replies_count
AFTER INSERT OR DELETE ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_post_replies_count();