-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can view all completed offers" ON public.completed_offers;
DROP POLICY IF EXISTS "Users can view their own completed offers" ON public.completed_offers;

-- Create PERMISSIVE SELECT policies (default is PERMISSIVE)
CREATE POLICY "Users can view their own completed offers"
ON public.completed_offers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all completed offers"
ON public.completed_offers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));