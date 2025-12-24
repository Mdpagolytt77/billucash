-- Create site_settings table to store logo and other settings
CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  logo_type text NOT NULL DEFAULT 'text',
  logo_text text DEFAULT 'BILLUCASH',
  logo_image_url text,
  offerwall_settings jsonb DEFAULT '{}',
  sound_settings jsonb DEFAULT '{}',
  background_settings jsonb DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (id, logo_type, logo_text)
VALUES ('default', 'text', 'BILLUCASH');