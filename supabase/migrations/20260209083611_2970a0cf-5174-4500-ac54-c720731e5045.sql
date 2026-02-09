
-- Create item trade offers table
CREATE TABLE public.rp_trade_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  from_character_id UUID NOT NULL,
  to_character_id UUID NOT NULL,
  offered_items JSONB NOT NULL DEFAULT '[]',
  requested_items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.rp_trade_offers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view trade offers in their session"
  ON public.rp_trade_offers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create trade offers"
  ON public.rp_trade_offers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update trade offers"
  ON public.rp_trade_offers FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX idx_rp_trade_offers_session ON public.rp_trade_offers(session_id);
CREATE INDEX idx_rp_trade_offers_status ON public.rp_trade_offers(status);
