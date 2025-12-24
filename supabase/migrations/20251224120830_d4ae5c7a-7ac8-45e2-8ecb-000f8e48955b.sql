
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read site settings" ON public.site_settings;

-- Create a new policy that allows everyone (including anonymous users) to read site settings
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);
