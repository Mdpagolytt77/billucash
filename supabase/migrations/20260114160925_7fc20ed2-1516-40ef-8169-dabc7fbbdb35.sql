-- Add coin_icon_url column to site_settings table for custom coin icon
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS coin_icon_url TEXT DEFAULT NULL;