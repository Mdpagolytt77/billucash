-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own completed offers" ON public.completed_offers;

-- Restore policy: All authenticated users can view all completed offers
CREATE POLICY "Authenticated users can view all completed offers"
ON public.completed_offers
FOR SELECT
TO authenticated
USING (true);