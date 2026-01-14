-- Add provider_logos column to site_settings for admin-uploadable offerwall logos
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS provider_logos jsonb DEFAULT '[]'::jsonb;

-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_public_site_settings();

-- Recreate the function with provider_logos included
CREATE FUNCTION public.get_public_site_settings()
RETURNS TABLE (
  id text,
  logo_type text,
  logo_text text,
  logo_image_url text,
  coin_icon_url text,
  background_settings jsonb,
  offerwall_settings jsonb,
  social_links_settings jsonb,
  sound_settings jsonb,
  provider_logos jsonb,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    logo_type,
    logo_text,
    logo_image_url,
    coin_icon_url,
    background_settings,
    offerwall_settings,
    social_links_settings,
    sound_settings,
    provider_logos,
    updated_at
  FROM public.site_settings
  LIMIT 1;
$$;