-- Add turn-based support to sessions
ALTER TABLE public.rp_sessions 
ADD COLUMN IF NOT EXISTS max_players integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_turn_player_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS turn_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS turn_order uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS session_code text UNIQUE;

-- Create session invitations table
CREATE TABLE IF NOT EXISTS public.rp_session_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.rp_sessions(id) ON DELETE CASCADE NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE(session_id, invited_user_id)
);

-- Create session chat/log table for group communication
CREATE TABLE IF NOT EXISTS public.rp_session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.rp_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_type text DEFAULT 'chat' CHECK (message_type IN ('chat', 'action', 'system', 'roll')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rp_session_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_session_messages ENABLE ROW LEVEL SECURITY;

-- RLS for invitations - users can see invitations they sent or received
CREATE POLICY "Users can view their invitations" ON public.rp_session_invitations
  FOR SELECT USING (invited_user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Users can respond to their invitations" ON public.rp_session_invitations
  FOR UPDATE USING (invited_user_id = auth.uid());

CREATE POLICY "Session creators can send invitations" ON public.rp_session_invitations
  FOR INSERT WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Session creators can delete invitations" ON public.rp_session_invitations
  FOR DELETE USING (invited_by = auth.uid());

-- RLS for messages - session participants can view/send
CREATE POLICY "Participants can view session messages" ON public.rp_session_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rp_session_participants sp
      WHERE sp.session_id = rp_session_messages.session_id
      AND sp.character_id IN (
        SELECT id FROM public.rp_characters WHERE user_id = auth.uid()
      )
    ) OR EXISTS (
      SELECT 1 FROM public.rp_sessions s
      WHERE s.id = rp_session_messages.session_id
      AND s.created_by = auth.uid()
    )
  );

CREATE POLICY "Participants can send session messages" ON public.rp_session_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Enable realtime for sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rp_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rp_session_messages;

-- Generate unique session code function
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;