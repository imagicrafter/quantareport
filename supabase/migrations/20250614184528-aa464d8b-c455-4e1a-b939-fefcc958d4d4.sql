
-- First, create a helper function to check if a user has a specific role.
-- This will be used in our security policies.
create or replace function public.check_user_role(p_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = p_role
  );
$$;

-- Next, enable Row Level Security on the app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read settings.
-- This is needed for the sign-up page to check if a code is required.
CREATE POLICY "Allow public read access to app settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Create a policy to allow only admins to add new settings.
CREATE POLICY "Allow admin to insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_role('admin'));

-- Create a policy to allow only admins to update existing settings.
CREATE POLICY "Allow admin to update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.check_user_role('admin'));

-- Create a policy to allow only admins to delete settings.
CREATE POLICY "Allow admin to delete app settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'));
