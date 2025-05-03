
CREATE OR REPLACE FUNCTION public.handle_signup_code_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  require_signup_code BOOLEAN;
  signup_code TEXT;
BEGIN
  -- Get the signup code from metadata
  signup_code := NEW.raw_user_meta_data->>'signup_code';
  
  -- Check if signup codes are required
  SELECT (value->>'require_signup_code')::BOOLEAN INTO require_signup_code 
  FROM app_settings 
  WHERE key = 'signup_requirements' 
  LIMIT 1;
  
  -- Log for debugging
  RAISE LOG 'Processing signup: Email=%, Code=%, RequireCode=%', 
    NEW.email, 
    signup_code,
    require_signup_code;
    
  -- Only update signup code if it's provided and either required or explicitly provided
  IF signup_code IS NOT NULL AND signup_code != '' THEN
    
    UPDATE public.signup_codes
    SET 
      used = true,
      used_at = NOW(),
      status = 'registered'
    WHERE 
      code = signup_code
      AND email = NEW.email
      AND used = false;
    
    -- Return early if we have a signup code
    RETURN NEW;
  END IF;
  
  -- If we get here, no signup code was provided
  -- If codes are required, log a warning
  IF require_signup_code THEN
    RAISE LOG 'Warning: User created without required signup code: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$function$;
