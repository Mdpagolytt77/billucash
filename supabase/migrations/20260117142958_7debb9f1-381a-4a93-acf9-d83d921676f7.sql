-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all completed offers" ON public.completed_offers;

-- Create new policy: Users can only view their own completed offers
CREATE POLICY "Users can view their own completed offers"
ON public.completed_offers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create new policy: Admins can view all completed offers
CREATE POLICY "Admins can view all completed offers"
ON public.completed_offers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));