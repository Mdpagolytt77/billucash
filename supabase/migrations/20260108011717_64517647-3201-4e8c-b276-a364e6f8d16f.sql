-- Fix: Ensure get_public_site_settings does NOT expose postback_secret
-- The function already excludes postback_secret, but let's make sure it's secure
DROP FUNCTION IF EXISTS public.get_public_site_settings();

CREATE OR REPLACE FUNCTION public.get_public_site_settings()
RETURNS TABLE(
  id text, 
  logo_type text, 
  logo_text text, 
  logo_image_url text, 
  offerwall_settings jsonb, 
  sound_settings jsonb, 
  background_settings jsonb,
  social_links_settings jsonb,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, 
    logo_type, 
    logo_text, 
    logo_image_url, 
    offerwall_settings, 
    sound_settings, 
    background_settings,
    social_links_settings,
    updated_at
  FROM public.site_settings
  WHERE id = 'default'
$$;