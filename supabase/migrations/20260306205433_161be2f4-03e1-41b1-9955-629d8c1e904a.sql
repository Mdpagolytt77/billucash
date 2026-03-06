
CREATE TABLE public.notik_offers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  click_url TEXT,
  payout NUMERIC NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  platform TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notik_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active notik offers"
ON public.notik_offers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role can manage notik offers"
ON public.notik_offers
FOR ALL
USING (true)
WITH CHECK (true);
