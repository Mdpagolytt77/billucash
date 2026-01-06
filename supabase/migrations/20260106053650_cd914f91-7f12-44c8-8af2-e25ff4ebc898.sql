-- Add 'moderator' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- Add RLS policy for admins to view all roles (needed for real-time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all roles' AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Enable realtime for user_roles table
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;