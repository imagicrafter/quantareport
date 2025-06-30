
-- ROLLBACK SQL SCRIPT - Save this before implementing the RLS policy fixes
-- This script will restore the current RLS policies if rollback is needed

-- First, drop all existing policies that we'll be replacing
DROP POLICY IF EXISTS "Allow public read access to app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin to insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin to update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin to delete app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage all custom reports" ON public.custom_reports;
DROP POLICY IF EXISTS "Users can view their own custom reports" ON public.custom_reports;
DROP POLICY IF EXISTS "Public can view active reports by token" ON public.custom_reports;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.user_subscriptions;

-- Recreate the original policies exactly as they were

-- App Settings policies (original)
CREATE POLICY "Allow public read access to app settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin to insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_role('admin'));

CREATE POLICY "Allow admin to update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.check_user_role('admin'));

CREATE POLICY "Allow admin to delete app settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'));

-- Custom Reports policies (original)
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

CREATE POLICY "Users can view their own custom reports" 
  ON public.custom_reports 
  FOR SELECT 
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Public can view active reports by token" 
  ON public.custom_reports 
  FOR SELECT 
  TO anon
  USING (is_active = true);

-- User Subscriptions policies (original)
CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.user_subscriptions
FOR DELETE
USING (auth.uid() = user_id);
