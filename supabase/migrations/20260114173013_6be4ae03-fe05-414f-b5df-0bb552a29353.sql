-- Create featured_offers table
CREATE TABLE public.featured_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  color TEXT DEFAULT '#1a1a2e',
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_offers ENABLE ROW LEVEL SECURITY;

-- Public can read active offers
CREATE POLICY "Anyone can view active featured offers"
ON public.featured_offers
FOR SELECT
USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can manage featured offers"
ON public.featured_offers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_offers;

-- Add trigger for updated_at
CREATE TRIGGER update_featured_offers_updated_at
BEFORE UPDATE ON public.featured_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();