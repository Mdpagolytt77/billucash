-- Allow moderators to view all profiles (read-only)
CREATE POLICY "Moderators can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));
