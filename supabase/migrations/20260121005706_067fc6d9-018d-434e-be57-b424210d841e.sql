-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.get_live_tracker_offers(integer);

-- Recreate with country field instead of sensitive fields
CREATE FUNCTION public.get_live_tracker_offers(limit_count integer DEFAULT 20)
RETURNS TABLE(id uuid, username text, coin integer, offerwall text, country text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Update get_offer_details to hide sensitive fields for non-admin users
CREATE OR REPLACE FUNCTION public.get_offer_details(offer_id uuid)
RETURNS TABLE(id uuid, username text, coin integer, offerwall text, offer_name text, ip text, country text, transaction_id text, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF has_role(auth.uid(), 'admin') THEN
    -- Admins see everything
    RETURN QUERY
    SELECT 
      co.id,
      co.username,
      co.coin,
      co.offerwall,
      co.offer_name,
      co.ip,
      co.country,
      co.transaction_id,
      co.created_at
    FROM public.completed_offers co
    WHERE co.id = offer_id;
  ELSE
    -- Regular users see limited data (no IP, no transaction_id)
    RETURN QUERY
    SELECT 
      co.id,
      co.username,
      co.coin,
      co.offerwall,
      co.offer_name,
      NULL::text as ip,
      COALESCE(co.country, 'Unknown') as country,
      NULL::text as transaction_id,
      co.created_at
    FROM public.completed_offers co
    WHERE co.id = offer_id;
  END IF;
END;
$$;