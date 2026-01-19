-- Create user_preferences table to store user settings like infinite scroll
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  infinite_scroll_enabled BOOLEAN DEFAULT false,
  notifications_comments BOOLEAN DEFAULT true,
  notifications_likes BOOLEAN DEFAULT true,
  notifications_follows BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create social_notifications table for likes, comments, and follows
CREATE TABLE public.social_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  triggered_by_user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'reply')),
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own social notifications"
ON public.social_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create social notifications"
ON public.social_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own social notifications"
ON public.social_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social notifications"
ON public.social_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_social_notifications_user_id ON public.social_notifications(user_id);
CREATE INDEX idx_social_notifications_unread ON public.social_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);