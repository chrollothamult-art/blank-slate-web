-- Enable RLS on all UGC-related tables
ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any exist (to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.user_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.user_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.user_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.user_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON public.user_submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.user_submissions;

DROP POLICY IF EXISTS "Anyone can view comments on approved submissions" ON public.submission_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.submission_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.submission_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.submission_comments;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.submission_likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.submission_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.submission_likes;

DROP POLICY IF EXISTS "Anyone can view tags" ON public.submission_tags;
DROP POLICY IF EXISTS "Users can create tags on their submissions" ON public.submission_tags;
DROP POLICY IF EXISTS "Users can delete tags on their submissions" ON public.submission_tags;

-- RLS Policies for user_submissions
CREATE POLICY "Anyone can view approved submissions" 
ON public.user_submissions 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own submissions" 
ON public.user_submissions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" 
ON public.user_submissions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending submissions" 
ON public.user_submissions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can delete their own submissions" 
ON public.user_submissions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all submissions" 
ON public.user_submissions 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage all submissions" 
ON public.user_submissions 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for submission_comments
CREATE POLICY "Anyone can view comments" 
ON public.submission_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.submission_comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.submission_comments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.submission_comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for submission_likes
CREATE POLICY "Anyone can view likes" 
ON public.submission_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create likes" 
ON public.submission_likes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.submission_likes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for submission_tags
CREATE POLICY "Anyone can view tags" 
ON public.submission_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create tags on their submissions" 
ON public.submission_tags 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_submissions 
    WHERE id = submission_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tags on their submissions" 
ON public.submission_tags 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_submissions 
    WHERE id = submission_id AND user_id = auth.uid()
  )
);