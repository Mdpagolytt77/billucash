
-- 1. USERNAME VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Trim whitespace
  NEW.username := trim(NEW.username);
  
  -- Check empty
  IF NEW.username IS NULL OR NEW.username = '' THEN
    RAISE EXCEPTION 'Username cannot be empty';
  END IF;
  
  -- Check length (3-30 chars)
  IF char_length(NEW.username) < 3 OR char_length(NEW.username) > 30 THEN
    RAISE EXCEPTION 'Username must be between 3 and 30 characters';
  END IF;
  
  -- Check format (alphanumeric, underscore, dot, hyphen)
  IF NEW.username !~ '^[a-zA-Z0-9_.-]+$' THEN
    RAISE EXCEPTION 'Username can only contain letters, numbers, underscores, dots, and hyphens';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_username_before_change
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username();

-- 2. FIX MODERATOR SITE_SETTINGS POLICY (remove direct access, they use site_settings_safe view)
DROP POLICY IF EXISTS "Moderators can read non-sensitive site settings" ON public.site_settings;

-- 3. ADD UNIQUE CONSTRAINT ON TRANSACTION_ID (prevents race condition duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_completed_offers_unique_txid 
  ON public.completed_offers (transaction_id) 
  WHERE transaction_id IS NOT NULL;
