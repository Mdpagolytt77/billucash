-- Create increment_balance function that handles both positive and negative amounts
CREATE OR REPLACE FUNCTION public.increment_balance(user_id_input text, amount_input numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + amount_input,
      updated_at = now()
  WHERE id = user_id_input::uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_input;
  END IF;
END;
$$;