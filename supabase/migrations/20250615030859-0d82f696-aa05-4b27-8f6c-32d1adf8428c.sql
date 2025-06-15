
-- Step 1: Clean up all old triggers and functions to ensure a clean state.
-- We use CASCADE to handle any lingering dependencies that caused the previous migration to fail.
DROP FUNCTION IF EXISTS public.handle_signup_code_usage() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_change_signup_code() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Recreate the function to sync auth.users with public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  profile_plan TEXT;
  subscription_id_to_set UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, email, phone)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        NEW.raw_user_meta_data->>'phone'
    );
    profile_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'Free');
    SELECT id INTO subscription_id_to_set
    FROM public.subscriptions
    WHERE name = profile_plan;
    IF subscription_id_to_set IS NULL THEN
      SELECT id INTO subscription_id_to_set
      FROM public.subscriptions
      WHERE name = 'Free';
    END IF;
    IF subscription_id_to_set IS NOT NULL THEN
      INSERT INTO public.user_subscriptions(user_id, subscription_id, status)
      VALUES (NEW.id, subscription_id_to_set, 'active');
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.profiles
    SET
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
      phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Step 3: Recreate the trigger for the user sync function.
CREATE TRIGGER on_auth_user_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Recreate the function to handle the signup code logic when a profile changes.
CREATE OR REPLACE FUNCTION public.handle_profile_change_signup_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_metadata JSONB;
  signup_code TEXT;
BEGIN
  RAISE LOG '[handle_profile_change_signup_code] Trigger fired for profile id: % on %', NEW.id, TG_OP;

  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = NEW.id;

  signup_code := user_metadata->>'signup_code';
  
  IF signup_code IS NOT NULL AND signup_code <> '' THEN
    RAISE LOG '[handle_profile_change_signup_code] Found signup code: %. Attempting to mark as used for email %.', signup_code, NEW.email;

    UPDATE public.signup_codes
    SET 
      used = true,
      used_at = NOW(),
      status = 'registered'
    WHERE 
      code = signup_code
      AND email = NEW.email
      AND used = false;
    
    IF FOUND THEN
      RAISE LOG '[handle_profile_change_signup_code] Success: Marked code % as used for email %.', signup_code, NEW.email;
    ELSE
      RAISE LOG '[handle_profile_change_signup_code] Info: Code % for email % not updated. May be invalid or already used.', signup_code, NEW.email;
    END IF;
  ELSE
    RAISE LOG '[handle_profile_change_signup_code] No signup code in metadata for user %. Skipping update.', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Recreate the trigger on the profiles table. This is the correct, reliable approach.
CREATE TRIGGER on_profile_change_handle_signup_code
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_change_signup_code();
