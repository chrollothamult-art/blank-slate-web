-- Create discussion_replies table for book club discussions
CREATE TABLE public.discussion_replies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID NOT NULL REFERENCES public.book_club_discussions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create private_conversations table
CREATE TABLE public.private_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_one UUID NOT NULL,
    participant_two UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(participant_one, participant_two)
);

-- Create private_messages table
CREATE TABLE public.private_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for discussion_replies
CREATE POLICY "Anyone can view discussion replies"
ON public.discussion_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.discussion_replies FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies"
ON public.discussion_replies FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own replies"
ON public.discussion_replies FOR DELETE
USING (auth.uid() = author_id);

-- RLS policies for private_conversations
CREATE POLICY "Users can view their own conversations"
ON public.private_conversations FOR SELECT
USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Authenticated users can create conversations"
ON public.private_conversations FOR INSERT
WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

-- RLS policies for private_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.private_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.private_conversations
        WHERE id = conversation_id
        AND (participant_one = auth.uid() OR participant_two = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.private_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.private_conversations
        WHERE id = conversation_id
        AND (participant_one = auth.uid() OR participant_two = auth.uid())
    )
);

CREATE POLICY "Users can update read status of messages sent to them"
ON public.private_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.private_conversations
        WHERE id = conversation_id
        AND (participant_one = auth.uid() OR participant_two = auth.uid())
    )
    AND sender_id != auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_discussion_replies_discussion_id ON public.discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_parent_id ON public.discussion_replies(parent_reply_id);
CREATE INDEX idx_private_messages_conversation_id ON public.private_messages(conversation_id);
CREATE INDEX idx_private_messages_sender_id ON public.private_messages(sender_id);
CREATE INDEX idx_private_conversations_participants ON public.private_conversations(participant_one, participant_two);