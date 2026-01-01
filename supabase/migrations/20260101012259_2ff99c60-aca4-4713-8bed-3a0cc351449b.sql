-- Drop and recreate the view with SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.site_settings_public;

CREATE VIEW public.site_settings_public 
WITH (security_invoker = true)
AS
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
FROM public.site_settings;

-- Grant access to the view for all users
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

-- Also add a permissive SELECT policy for public access to non-sensitive data via the view
CREATE POLICY "Public can read site settings for view"
ON public.site_settings
FOR SELECT
USING (true);