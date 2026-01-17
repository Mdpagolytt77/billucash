-- Add explicit deny policy for non-admin users on site_settings
-- This ensures only admins can access site_settings even if other policies exist

CREATE POLICY "Deny non-admin access to site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));