-- Allow moderators to view all completed offers (read-only)
CREATE POLICY "Moderators can view all completed offers"
ON public.completed_offers
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all withdrawals (read-only)
CREATE POLICY "Moderators can view all withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to read site settings via direct query (read-only)
CREATE POLICY "Moderators can read site settings"
ON public.site_settings
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));
