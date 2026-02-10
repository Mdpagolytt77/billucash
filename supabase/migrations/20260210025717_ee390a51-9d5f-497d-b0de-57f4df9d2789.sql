-- Allow moderators to view all user roles (read-only access)
CREATE POLICY "Moderators can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));
