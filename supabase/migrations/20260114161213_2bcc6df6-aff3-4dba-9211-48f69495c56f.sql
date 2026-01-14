-- Drop and recreate the get_public_site_settings function to include coin_icon_url
DROP FUNCTION IF EXISTS public.get_public_site_settings();

CREATE OR REPLACE FUNCTION public.get_public_site_settings()
RETURNS TABLE(
  background_settings json,
  id text,
  logo_image_url text,
  logo_text text,
  logo_type text,
  offerwall_settings json,
  social_links_settings json,
  sound_settings json,
  updated_at text,
  coin_icon_url text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.background_settings::json,
    s.id::text,
    s.logo_image_url::text,
    s.logo_text::text,
    s.logo_type::text,
    s.offerwall_settings::json,
    s.social_links_settings::json,
    s.sound_settings::json,
    s.updated_at::text,
    s.coin_icon_url::text
  FROM public.site_settings s
  WHERE s.id = 'default';
END;
$$;