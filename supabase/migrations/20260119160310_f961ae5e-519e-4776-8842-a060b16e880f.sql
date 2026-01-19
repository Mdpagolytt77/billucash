-- Create storage bucket for payment method icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-icons', 'payment-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to payment icons
CREATE POLICY "Public can view payment icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-icons');

-- Allow admins to upload/delete payment icons
CREATE POLICY "Admins can manage payment icons"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-icons' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'payment-icons' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon_url TEXT,
  gradient TEXT NOT NULL DEFAULT 'from-gray-500 to-gray-700',
  category TEXT NOT NULL CHECK (category IN ('crypto', 'giftcard', 'cash')),
  min_amount NUMERIC NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Public can view active payment methods
CREATE POLICY "Public can view active payment methods"
ON public.payment_methods FOR SELECT
USING (is_active = true);

-- Admins can manage all payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;

-- Insert default payment methods
INSERT INTO public.payment_methods (name, gradient, category, min_amount, sort_order) VALUES
-- Crypto
('Binance', 'from-yellow-600 to-yellow-800', 'crypto', 5, 1),
('Litecoin', 'from-gray-500 to-gray-700', 'crypto', 5, 2),
('Tron', 'from-red-500 to-red-700', 'crypto', 3, 3),
('Bitcoin', 'from-amber-500 to-amber-700', 'crypto', 10, 4),
('Dogecoin', 'from-yellow-400 to-yellow-600', 'crypto', 2, 5),
-- Gift Cards
('Google Play', 'from-green-600 to-blue-600', 'giftcard', 5, 6),
('Walmart', 'from-blue-500 to-blue-700', 'giftcard', 10, 7),
('PayPal', 'from-blue-400 to-blue-600', 'giftcard', 5, 8),
-- Cash
('Wise', 'from-green-400 to-teal-600', 'cash', 5, 9),
('Payoneer', 'from-orange-500 to-red-600', 'cash', 10, 10),
('Payeer', 'from-blue-500 to-cyan-600', 'cash', 1, 11),
('bKash', 'from-pink-600 to-pink-800', 'cash', 1, 12),
('Nagad', 'from-orange-500 to-orange-700', 'cash', 1, 13);

-- Create update trigger
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();