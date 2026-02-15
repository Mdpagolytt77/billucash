
CREATE OR REPLACE FUNCTION public.get_offer_details(offer_id uuid)
 RETURNS TABLE(id uuid, username text, coin integer, offerwall text, offer_name text, ip text, country text, transaction_id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Admins see everything
  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT 
      co.id, co.username, co.coin, co.offerwall, co.offer_name,
      co.ip, co.country, co.transaction_id, co.created_at
    FROM public.completed_offers co
    WHERE co.id = offer_id;
  ELSE
    -- Regular users can only see their OWN offers (no IP, no transaction_id)
    RETURN QUERY
    SELECT 
      co.id, co.username, co.coin, co.offerwall, co.offer_name,
      NULL::text as ip,
      COALESCE(co.country, 'Unknown') as country,
      NULL::text as transaction_id,
      co.created_at
    FROM public.completed_offers co
    WHERE co.id = offer_id
      AND co.user_id = auth.uid();
  END IF;
END;
$$;
