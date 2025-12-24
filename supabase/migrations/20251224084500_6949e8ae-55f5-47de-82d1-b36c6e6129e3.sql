-- Create completed_offers table for real-time tracking
CREATE TABLE public.completed_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  offerwall TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  coin INTEGER NOT NULL,
  transaction_id TEXT,
  ip TEXT,
  country TEXT DEFAULT 'Unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.completed_offers ENABLE ROW LEVEL SECURITY;

-- Admins can view all completed offers
CREATE POLICY "Admins can view all completed offers"
ON public.completed_offers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own completed offers
CREATE POLICY "Users can view their own completed offers"
ON public.completed_offers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can insert completed offers (for postback/webhook)
CREATE POLICY "Admins can insert completed offers"
ON public.completed_offers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.completed_offers;

-- Create index for faster queries
CREATE INDEX idx_completed_offers_created_at ON public.completed_offers(created_at DESC);
CREATE INDEX idx_completed_offers_user_id ON public.completed_offers(user_id);