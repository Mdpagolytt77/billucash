-- Add policy to allow admins to delete approved withdrawal requests
CREATE POLICY "Admins can delete approved withdrawals"
ON public.withdrawal_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) AND status = 'approved');