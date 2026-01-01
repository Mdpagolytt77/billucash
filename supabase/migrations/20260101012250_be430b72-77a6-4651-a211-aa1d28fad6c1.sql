-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

-- Create policy that only admins can read all columns (including postback_secret)
CREATE POLICY "Admins can read all site settings"
ON public.site_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view that excludes sensitive fields
CREATE OR REPLACE VIEW public.site_settings_public AS
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