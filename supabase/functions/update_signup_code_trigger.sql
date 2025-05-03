
CREATE OR REPLACE FUNCTION public.handle_signup_code_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  require_signup_code BOOLEAN;
  signup_code TEXT;
  settings_record RECORD;
BEGIN
  -- Get the signup code from metadata
  signup_code := NEW.raw_user_meta_data->>'signup_code';
  
  -- Default to requiring signup codes for security
  require_signup_code := TRUE;
  
  -- Check if app_settings table exists and get settings if it does
  BEGIN
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'app_settings'
    ) INTO require_signup_code;
    
    IF require_signup_code THEN
      -- Try to get the settings
      SELECT * INTO settings_record
      FROM app_settings 
      WHERE key = 'signup_requirements' 
      LIMIT 1;
      
      IF FOUND THEN
        -- Extract the setting from the record
        require_signup_code := (settings_record.value->>'require_signup_code')::BOOLEAN;
      END IF;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue with default (requiring codes)
    RAISE LOG 'Error checking signup requirements: %', SQLERRM;
  END;
  
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

