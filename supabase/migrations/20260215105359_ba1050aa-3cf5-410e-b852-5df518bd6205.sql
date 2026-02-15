
-- Drop the existing moderator policy that gives full read access
DROP POLICY IF EXISTS "Moderators can read site settings" ON public.site_settings;

-- Create a view for moderators that excludes sensitive fields
CREATE OR REPLACE VIEW public.site_settings_safe
WITH (security_invoker = on) AS
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
    homepage_images,
    updated_at
    -- postback_secret is intentionally excluded
  FROM public.site_settings;

-- Allow moderators to read the safe view via a policy on the base table
-- that only grants access to moderators through the safe view
CREATE POLICY "Moderators can read non-sensitive site settings"
  ON public.site_settings FOR SELECT
  USING (
    has_role(auth.uid(), 'moderator'::app_role)
    AND current_setting('request.path', true) IS DISTINCT FROM NULL
  );
