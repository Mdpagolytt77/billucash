
CREATE OR REPLACE FUNCTION public.increment_balance(user_id_input text, amount_input numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    _previous_balance NUMERIC;
    _new_balance NUMERIC;
BEGIN
    -- Input validation: Amount bounds (increased to support large coin rewards)
    IF amount_input > 10000000 OR amount_input < -10000000 THEN
        RAISE EXCEPTION 'Amount out of bounds: %', amount_input;
    END IF;
    
    -- Validate user_id format (must be valid UUID)
    IF user_id_input IS NULL OR user_id_input = '' THEN
        RAISE EXCEPTION 'Invalid user ID';
    END IF;
    
    -- Get current balance with row lock to prevent race conditions
    SELECT COALESCE(balance, 0) INTO _previous_balance
    FROM profiles
    WHERE id = user_id_input::uuid
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', user_id_input;
    END IF;
    
    -- Calculate new balance
    _new_balance := _previous_balance + amount_input;
    
    -- Prevent negative balance
    IF _new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Update balance
    UPDATE profiles
    SET balance = _new_balance, updated_at = now()
    WHERE id = user_id_input::uuid;
END;
$$;
