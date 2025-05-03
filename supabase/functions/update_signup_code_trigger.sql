
CREATE OR REPLACE FUNCTION public.handle_signup_code_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  require_signup_code BOOLEAN;
  signup_code TEXT;
  settings_exists BOOLEAN;
BEGIN
  -- Get the signup code from metadata
  signup_code := NEW.raw_user_meta_data->>'signup_code';
  
  -- Default to not requiring signup codes (failsafe)
  require_signup_code := FALSE;
  
  -- Check if app_settings table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_settings'
  ) INTO settings_exists;
  
  -- Only check settings if the table exists
  IF settings_exists THEN
    BEGIN
      -- Try to get require_signup_code setting
      SELECT (value->>'require_signup_code')::BOOLEAN INTO require_signup_code 
      FROM public.app_settings 
      WHERE key = 'signup_requirements' 
      LIMIT 1;
      
      -- If no setting found, default to FALSE for safety
      IF require_signup_code IS NULL THEN
        require_signup_code := FALSE;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with default (not requiring codes)
      RAISE LOG 'Error checking signup requirements: %', SQLERRM;
      require_signup_code := FALSE;
    END;
  END IF;
  
  -- Log for debugging
  RAISE LOG 'Processing signup: Email=%, Code=%, RequireCode=%', 
    NEW.email, 
    signup_code,
    require_signup_code;
    
  -- Only update signup code if it's provided and either required or explicitly provided
  IF signup_code IS NOT NULL AND signup_code != '' THEN
    BEGIN
      UPDATE public.signup_codes
      SET 
        used = true,
        used_at = NOW(),
        status = 'registered'
      WHERE 
        code = signup_code
        AND email = NEW.email
        AND used = false;
      
      EXCEPTION WHEN OTHERS THEN
        -- Log error but allow signup to continue
        RAISE LOG 'Error updating signup code: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;
