-- Add website_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN public.profiles.website_url IS 'External link for the coordinator disclosure website';
