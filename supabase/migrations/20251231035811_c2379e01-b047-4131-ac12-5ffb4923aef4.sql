-- Add policy to allow admins to update completed offers
CREATE POLICY "Admins can update completed offers"
ON public.completed_offers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));