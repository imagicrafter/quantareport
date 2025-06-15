
-- Step 1: Update the database function with enhanced logging for better debugging.
-- This version adds more detailed log messages to track the process of marking a code as used.
CREATE OR REPLACE FUNCTION public.handle_signup_code_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  signup_code TEXT;
BEGIN
  -- Get the signup code from the new or updated user's metadata
  signup_code := NEW.raw_user_meta_data->>'signup_code';
  
  -- Log the trigger execution for debugging
  RAISE LOG '[handle_signup_code_usage] Trigger fired for email: %. Code from metadata: %', 
    NEW.email, 
    signup_code;
    
  -- Only proceed if a signup code is provided
  IF signup_code IS NOT NULL AND signup_code <> '' THEN
    BEGIN
      RAISE LOG '[handle_signup_code_usage] Attempting to mark code as used for email: %, code: %', NEW.email, signup_code;

      UPDATE public.signup_codes
      SET 
        used = true,
        used_at = NOW(),
        status = 'registered'
      WHERE 
        code = signup_code
        AND email = NEW.email
        AND used = false;
      
      -- Check if the update was successful and log the outcome
      IF FOUND THEN
        RAISE LOG '[handle_signup_code_usage] Success: Marked signup code % as used for email %.', signup_code, NEW.email;
      ELSE
        RAISE LOG '[handle_signup_code_usage] Info: Signup code % for email % was not updated. It might be invalid or already used.', signup_code, NEW.email;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log any errors but allow the main operation (user creation/update) to succeed
      RAISE WARNING '[handle_signup_code_usage] Error updating signup code: %', SQLERRM;
    END;
  ELSE
    RAISE LOG '[handle_signup_code_usage] No signup code in metadata for email %. Skipping update.', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 2: Drop any old triggers on auth.users to avoid conflicts.
-- We drop both potential old names to be safe.
DROP TRIGGER IF EXISTS on_auth_user_created_handle_signup_code ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_change_handle_signup_code ON auth.users;

-- Step 3: Create a single, robust trigger on auth.users.
-- This trigger will now fire on both INSERT (for email signups) and UPDATE (for OAuth signups),
-- ensuring signup codes are handled in all cases.
CREATE TRIGGER on_auth_user_change_handle_signup_code
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_signup_code_usage();

-- Step 4: As a final cleanup, remove any lingering, incorrect triggers on the profiles table
-- that may have been created during previous attempts to fix this issue.
DROP TRIGGER IF EXISTS on_profile_created_update_signup_code ON public.profiles;
