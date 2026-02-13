-- Add homepage_images jsonb column to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS homepage_images jsonb DEFAULT '{}'::jsonb;

-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS public.get_public_site_settings();

CREATE OR REPLACE FUNCTION public.get_public_site_settings()
 RETURNS TABLE(id text, logo_type text, logo_text text, logo_image_url text, coin_icon_url text, background_settings jsonb, offerwall_settings jsonb, social_links_settings jsonb, sound_settings jsonb, provider_logos jsonb, homepage_images jsonb, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  FROM public.site_settings
  LIMIT 1;
$function$;