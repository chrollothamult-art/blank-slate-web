-- Create submission notifications table
CREATE TABLE public.submission_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submission_id UUID REFERENCES public.user_submissions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('approved', 'rejected', 'featured')),
  message TEXT NOT NULL,
  admin_notes TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submission_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view their own submission notifications"
ON public.submission_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own submission notifications"
ON public.submission_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can insert notifications (for edge functions/admin)
CREATE POLICY "Service role can insert submission notifications"
ON public.submission_notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_submission_notifications_user_id ON public.submission_notifications(user_id);
CREATE INDEX idx_submission_notifications_is_read ON public.submission_notifications(user_id, is_read);

-- Add is_featured column to user_submissions for featured content
ALTER TABLE public.user_submissions ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.user_submissions ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP WITH TIME ZONE;

-- Create index for featured submissions
CREATE INDEX idx_user_submissions_featured ON public.user_submissions(is_featured, featured_at DESC) WHERE is_featured = true;