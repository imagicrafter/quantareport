
-- Create the custom-reports storage bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('custom-reports', 'custom-reports', false);

-- Create storage policies for the custom-reports bucket
-- Allow authenticated users to upload files (admin only through RLS)
CREATE POLICY "Authenticated users can upload to custom-reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'custom-reports');

-- Allow authenticated users to read files (admin only through RLS)
CREATE POLICY "Authenticated users can read from custom-reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'custom-reports');

-- Allow authenticated users to delete files (admin only through RLS)
CREATE POLICY "Authenticated users can delete from custom-reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'custom-reports');

-- Add a column to store the pre-authorized URL
ALTER TABLE public.custom_reports 
ADD COLUMN pre_authorized_url text,
ADD COLUMN url_expires_at timestamp with time zone;
