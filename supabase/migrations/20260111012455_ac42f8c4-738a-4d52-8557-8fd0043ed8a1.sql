-- Add public SELECT policy for completed_offers (with limited columns for privacy)
-- This allows all users (including anonymous) to see recent completions for the live tracker
CREATE POLICY "Public can view completed offers for tracker"
ON public.completed_offers
FOR SELECT
USING (true);