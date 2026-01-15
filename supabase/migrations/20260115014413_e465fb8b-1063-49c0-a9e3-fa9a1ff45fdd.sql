-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own completed offers" ON public.completed_offers;
DROP POLICY IF EXISTS "Admins can view all completed offers" ON public.completed_offers;

-- Create single policy allowing all authenticated users to view all completed offers
CREATE POLICY "Authenticated users can view all completed offers"
ON public.completed_offers
FOR SELECT
TO authenticated
USING (true);