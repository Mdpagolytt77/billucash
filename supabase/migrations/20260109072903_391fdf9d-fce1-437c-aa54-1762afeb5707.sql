-- Add explicit deny policy for anonymous access to profiles table
-- This prevents unauthenticated users from reading email, balance, and other PII

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);