-- Add foreign key relationship from forum_notifications to profiles table
-- This fixes the "Could not find a relationship between 'forum_notifications' and 'profiles'" error

ALTER TABLE public.forum_notifications
ADD CONSTRAINT forum_notifications_triggered_by_user_id_fkey
FOREIGN KEY (triggered_by_user_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_forum_notifications_triggered_by 
ON public.forum_notifications(triggered_by_user_id);

-- Add foreign key for user_id to profiles as well
ALTER TABLE public.forum_notifications
ADD CONSTRAINT forum_notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;