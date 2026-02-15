
-- Drop the problematic "Deny anonymous access" policy that uses false
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Drop existing SELECT policies to recreate as PERMISSIVE with proper auth checks
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (OR logic: any one passing = access granted)
-- All require auth.uid() IS NOT NULL, which blocks anonymous access

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'moderator'::app_role));
