
-- Fix RLS policies to prevent infinite recursion by using the existing check_user_role function
-- This replaces direct queries to the profiles table with the security definer function

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all custom reports" ON public.custom_reports;

-- Recreate the admin policy using the existing check_user_role function
CREATE POLICY "Admins can manage all custom reports" 
  ON public.custom_reports 
  FOR ALL 
  TO authenticated
  USING (public.check_user_role('admin'));

-- The other policies don't have recursion issues, so we keep them as they are:
-- - "Users can view their own custom reports" uses uploaded_by = auth.uid() (no recursion)
-- - "Public can view active reports by token" doesn't reference user data (no recursion)
-- - App settings policies already use check_user_role correctly
-- - User subscriptions policies use auth.uid() = user_id directly (no recursion)
