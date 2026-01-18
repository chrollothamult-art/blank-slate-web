-- Forum Polls tables
CREATE TABLE public.forum_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.forum_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.forum_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.forum_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Book highlights and notes
CREATE TABLE public.book_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  page_number INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.book_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  page_number INTEGER NOT NULL,
  highlight_id UUID REFERENCES public.book_highlights(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Book Clubs
CREATE TABLE public.book_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  owner_id UUID NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  current_book_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.book_club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE TABLE public.book_club_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.book_clubs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  book_id UUID,
  chapter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_discussions ENABLE ROW LEVEL SECURITY;

-- Forum Polls RLS
CREATE POLICY "Anyone can view polls" ON public.forum_polls FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create polls" ON public.forum_polls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view poll options" ON public.forum_poll_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add poll options" ON public.forum_poll_options FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view poll votes" ON public.forum_poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.forum_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON public.forum_poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Book highlights and notes RLS
CREATE POLICY "Users can view their own highlights" ON public.book_highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own highlights" ON public.book_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own highlights" ON public.book_highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own highlights" ON public.book_highlights FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes" ON public.book_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.book_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.book_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.book_notes FOR DELETE USING (auth.uid() = user_id);

-- Book clubs RLS
CREATE POLICY "Anyone can view public clubs" ON public.book_clubs FOR SELECT USING (is_private = false OR auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.book_club_members WHERE club_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create clubs" ON public.book_clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their clubs" ON public.book_clubs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their clubs" ON public.book_clubs FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view club members" ON public.book_club_members FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON public.book_club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.book_club_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Club members can view discussions" ON public.book_club_discussions FOR SELECT USING (EXISTS (SELECT 1 FROM public.book_club_members WHERE club_id = book_club_discussions.club_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.book_clubs WHERE id = club_id AND owner_id = auth.uid()));
CREATE POLICY "Club members can create discussions" ON public.book_club_discussions FOR INSERT WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.book_club_members WHERE club_id = book_club_discussions.club_id AND user_id = auth.uid()));
CREATE POLICY "Authors can update discussions" ON public.book_club_discussions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete discussions" ON public.book_club_discussions FOR DELETE USING (auth.uid() = author_id);

-- Create indexes for performance
CREATE INDEX idx_forum_polls_post_id ON public.forum_polls(post_id);
CREATE INDEX idx_forum_poll_options_poll_id ON public.forum_poll_options(poll_id);
CREATE INDEX idx_forum_poll_votes_poll_id ON public.forum_poll_votes(poll_id);
CREATE INDEX idx_forum_poll_votes_user_id ON public.forum_poll_votes(user_id);
CREATE INDEX idx_book_highlights_user_book ON public.book_highlights(user_id, book_id);
CREATE INDEX idx_book_notes_user_book ON public.book_notes(user_id, book_id);
CREATE INDEX idx_book_club_members_club_id ON public.book_club_members(club_id);
CREATE INDEX idx_book_club_members_user_id ON public.book_club_members(user_id);
CREATE INDEX idx_book_club_discussions_club_id ON public.book_club_discussions(club_id);