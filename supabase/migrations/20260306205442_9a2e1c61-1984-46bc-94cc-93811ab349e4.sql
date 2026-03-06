
DROP POLICY "Service role can manage notik offers" ON public.notik_offers;

CREATE POLICY "Admins can manage notik offers"
ON public.notik_offers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
