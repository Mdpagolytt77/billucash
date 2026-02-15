
-- Ensure handle_new_user has no auto-admin logic (idempotent re-creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- All new users get 'user' role by default
  -- Admin roles must be manually assigned by existing admins
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Add unique constraint on username to prevent impersonation
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
