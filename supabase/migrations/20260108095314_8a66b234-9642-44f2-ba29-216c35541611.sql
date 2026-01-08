-- Fix 1: Revoke public access to increment_balance function (only Edge Functions with service role can call it)
REVOKE EXECUTE ON FUNCTION public.increment_balance(text, numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_balance(text, numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_balance(text, numeric) FROM anon;

-- Fix 2: Remove hardcoded admin username from handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- All new users get 'user' role by default
  -- Admin roles must be manually assigned by existing admins
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Fix 3: Update get_public_site_settings to filter out sensitive offerwall credentials
CREATE OR REPLACE FUNCTION public.get_public_site_settings()
 RETURNS TABLE(id text, logo_type text, logo_text text, logo_image_url text, offerwall_settings jsonb, sound_settings jsonb, background_settings jsonb, social_links_settings jsonb, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ss.id, 
    ss.logo_type, 
    ss.logo_text, 
    ss.logo_image_url,
    -- Filter offerwall_settings to remove sensitive credentials
    CASE 
      WHEN ss.offerwall_settings IS NULL THEN NULL
      WHEN ss.offerwall_settings ? 'offerwalls' THEN
        jsonb_build_object(
          'offerwalls', 
          (SELECT jsonb_agg(
            offerwall - 'apiKey' - 'secretKey'
          )
          FROM jsonb_array_elements(ss.offerwall_settings -> 'offerwalls') AS offerwall)
        )
      ELSE '{}'::jsonb
    END as offerwall_settings,
    ss.sound_settings, 
    ss.background_settings,
    ss.social_links_settings,
    ss.updated_at
  FROM public.site_settings ss
  WHERE ss.id = 'default'
$function$;