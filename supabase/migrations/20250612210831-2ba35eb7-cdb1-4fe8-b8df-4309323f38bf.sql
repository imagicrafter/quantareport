
-- Create the custom_reports table to track HTML files and their access tokens
CREATE TABLE public.custom_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  file_path text NOT NULL,
  original_filename text NOT NULL,
  title text,
  description text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  access_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamp with time zone
);

-- Add indexes for better performance
CREATE INDEX idx_custom_reports_token ON public.custom_reports(token);
CREATE INDEX idx_custom_reports_uploaded_by ON public.custom_reports(uploaded_by);
CREATE INDEX idx_custom_reports_is_active ON public.custom_reports(is_active);

-- Enable Row Level Security
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can do everything
CREATE POLICY "Admins can manage all custom reports" 
  ON public.custom_reports 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own uploads
CREATE POLICY "Users can view their own custom reports" 
  ON public.custom_reports 
  FOR SELECT 
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Public access for viewing reports by token (for the public endpoint)
CREATE POLICY "Public can view active reports by token" 
  ON public.custom_reports 
  FOR SELECT 
  TO anon
  USING (is_active = true);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON public.custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_reports_updated_at();
