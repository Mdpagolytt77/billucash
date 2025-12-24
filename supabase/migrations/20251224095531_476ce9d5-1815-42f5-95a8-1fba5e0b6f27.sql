-- Add social_links_settings to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS social_links_settings jsonb DEFAULT '[]'::jsonb;