-- Allow admins to delete completed offers
CREATE POLICY "Admins can delete completed offers"
ON public.completed_offers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));