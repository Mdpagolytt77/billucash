-- Drop and recreate get_live_tracker_offers function with numeric coin type
DROP FUNCTION IF EXISTS public.get_live_tracker_offers(integer);

CREATE FUNCTION public.get_live_tracker_offers(limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, username text, coin numeric, offerwall text, country text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    username,
    coin,
    offerwall,
    COALESCE(country, 'Unknown') as country,
    created_at
  FROM public.completed_offers
  ORDER BY created_at DESC
  LIMIT limit_count;
$function$;