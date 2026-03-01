CREATE OR REPLACE FUNCTION public.get_live_tracker_offers(limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, username text, coin numeric, offerwall text, country text, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, username, coin, offerwall, country, created_at
  FROM completed_offers
  WHERE created_at >= (now() AT TIME ZONE 'UTC' - interval '5 days')
  ORDER BY created_at DESC
  LIMIT limit_count;
$function$