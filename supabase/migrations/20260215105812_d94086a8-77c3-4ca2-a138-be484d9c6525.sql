
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all completed offers" ON public.completed_offers;

-- Create new policy: users can only see their own offers
CREATE POLICY "Users can view their own completed offers"
ON public.completed_offers
FOR SELECT
USING (auth.uid() = user_id);
