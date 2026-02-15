
-- Drop the old overly permissive policy that still exists
DROP POLICY IF EXISTS "Authenticated users can view all completed offers" ON public.completed_offers;
