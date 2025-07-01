
-- Create the published-reports storage bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('published-reports', 'published-reports', false);

-- Create storage policies for the published-reports bucket
-- Allow authenticated users to upload files (admin only through RLS)
CREATE POLICY "Authenticated users can upload to published-reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'published-reports');

-- Allow authenticated users to read files (admin only through RLS)
CREATE POLICY "Authenticated users can read from published-reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'published-reports');

-- Allow authenticated users to delete files (admin only through RLS)
CREATE POLICY "Authenticated users can delete from published-reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'published-reports');

-- Create the published_reports table
CREATE TABLE public.published_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  original_title text NOT NULL,
  title text,
  description text,
  published_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  access_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamp with time zone,
  pre_authorized_url text,
  url_expires_at timestamp with time zone
);

-- Enable RLS on published_reports
ALTER TABLE public.published_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for published_reports
-- Admins can manage all published reports
CREATE POLICY "Admins can manage all published reports"
ON public.published_reports
FOR ALL
TO authenticated
USING (check_user_role('admin'));

-- Users can view their own published reports
CREATE POLICY "Users can view their own published reports"
ON public.published_reports
FOR SELECT
TO authenticated
USING (published_by = auth.uid());

-- Users can publish their own reports
CREATE POLICY "Users can publish their own reports"
ON public.published_reports
FOR INSERT
TO authenticated
WITH CHECK (
  published_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = published_reports.report_id 
    AND reports.user_id = auth.uid()
  )
);

-- Users can update their own published reports
CREATE POLICY "Users can update their own published reports"
ON public.published_reports
FOR UPDATE
TO authenticated
USING (published_by = auth.uid());

-- Users can delete their own published reports
CREATE POLICY "Users can delete their own published reports"
ON public.published_reports
FOR DELETE
TO authenticated
USING (published_by = auth.uid());

-- Public can view active reports by token (for public access)
CREATE POLICY "Public can view active reports by token"
ON public.published_reports
FOR SELECT
TO anon
USING (is_active = true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_published_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_published_reports_updated_at
  BEFORE UPDATE ON public.published_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_published_reports_updated_at();
