
-- Update get_live_tracker_offers to be SECURITY DEFINER so all users can see today's offers
CREATE OR REPLACE FUNCTION public.get_live_tracker_offers(limit_count integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  username text,
  coin numeric,
  offerwall text,
  country text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, coin, offerwall, country, created_at
  FROM completed_offers
  WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
    AND created_at < date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day'
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;
