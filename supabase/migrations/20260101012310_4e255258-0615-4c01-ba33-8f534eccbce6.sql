-- Drop the overly permissive policy that exposes postback_secret
DROP POLICY IF EXISTS "Public can read site settings for view" ON public.site_settings;

-- Recreate the view using security invoker with a subquery that explicitly excludes postback_secret
-- The view will work because authenticated/anon users can access the view directly
DROP VIEW IF EXISTS public.site_settings_public;

-- Create a function that returns public site settings (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_public_site_settings()
RETURNS TABLE (
  id text,
  logo_type text,
  logo_text text,
  logo_image_url text,
  offerwall_settings jsonb,
  sound_settings jsonb,
  background_settings jsonb,
  social_links_settings jsonb,
  updated_at timestamptz
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