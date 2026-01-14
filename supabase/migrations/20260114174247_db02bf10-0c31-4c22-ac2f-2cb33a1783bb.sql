-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view completed offers for tracker" ON public.completed_offers;

-- Create a security definer function that returns ONLY non-sensitive data for the live tracker
CREATE OR REPLACE FUNCTION public.get_live_tracker_offers(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  username text,
  coin integer,
  offerwall text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    username,
    coin,
    offerwall,
    created_at
  FROM public.completed_offers
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_live_tracker_offers(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_live_tracker_offers(integer) TO authenticated;