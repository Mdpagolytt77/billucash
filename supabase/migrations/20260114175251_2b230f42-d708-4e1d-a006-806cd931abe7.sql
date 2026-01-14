-- Create a function to get full offer details (only for authenticated users/admins)
CREATE OR REPLACE FUNCTION public.get_offer_details(offer_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  coin integer,
  offerwall text,
  offer_name text,
  ip text,
  country text,
  transaction_id text,
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
    offer_name,
    ip,
    country,
    transaction_id,
    created_at
  FROM public.completed_offers
  WHERE completed_offers.id = offer_id;
$$;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_offer_details(uuid) TO authenticated;