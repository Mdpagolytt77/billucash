-- Create atomic function for withdrawal approval with balance deduction
CREATE OR REPLACE FUNCTION public.approve_withdrawal(_request_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _amount NUMERIC;
  _current_balance NUMERIC;
  _new_balance NUMERIC;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve withdrawals';
  END IF;

  -- Get request details and lock row
  SELECT user_id, amount INTO _user_id, _amount
  FROM withdrawal_requests
  WHERE id = _request_id AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Get current balance and lock profile row
  SELECT balance INTO _current_balance
  FROM profiles
  WHERE id = _user_id
  FOR UPDATE;
  
  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  -- Verify sufficient balance
  IF _current_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Calculate new balance
  _new_balance := _current_balance - _amount;
  
  -- Deduct balance atomically
  UPDATE profiles SET balance = _new_balance WHERE id = _user_id;
  
  -- Approve request
  UPDATE withdrawal_requests
  SET status = 'approved', approved_at = now(), updated_at = now()
  WHERE id = _request_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'previous_balance', _current_balance,
    'deducted', _amount,
    'new_balance', _new_balance
  );
END;
$$;

-- Create function for withdrawal rejection
CREATE OR REPLACE FUNCTION public.reject_withdrawal(_request_id UUID, _reason TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can reject withdrawals';
  END IF;

  -- Update request status
  UPDATE withdrawal_requests
  SET status = 'rejected', 
      rejection_reason = _reason,
      rejected_at = now(), 
      updated_at = now()
  WHERE id = _request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Add constraints for withdrawal validation
ALTER TABLE withdrawal_requests
  ADD CONSTRAINT amount_positive CHECK (amount > 0),
  ADD CONSTRAINT amount_reasonable CHECK (amount <= 100000),
  ADD CONSTRAINT method_valid CHECK (method IN ('bkash', 'nagad', 'rocket', 'upay')),
  ADD CONSTRAINT account_length CHECK (char_length(account) BETWEEN 5 AND 50);

-- Create validation trigger for withdrawal balance check
CREATE OR REPLACE FUNCTION public.validate_withdrawal_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance NUMERIC;
BEGIN
  -- Sanitize text inputs
  NEW.account := trim(NEW.account);
  NEW.method := lower(NEW.method);
  
  -- Get user's current balance
  SELECT balance INTO _current_balance
  FROM profiles
  WHERE id = NEW.user_id;
  
  IF _current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check balance
  IF NEW.amount > _current_balance THEN
    RAISE EXCEPTION 'Insufficient balance. Current balance: %', _current_balance;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_withdrawal_before_insert
  BEFORE INSERT ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION validate_withdrawal_insert();

-- Update site_settings RLS to protect API keys
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;

CREATE POLICY "Authenticated users can read site settings" 
ON site_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add postback_secret column to site_settings for secure postback verification
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS postback_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex');