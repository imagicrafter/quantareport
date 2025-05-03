
CREATE OR REPLACE FUNCTION public.handle_signup_code_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  signup_code TEXT;
BEGIN
  -- Get the signup code from metadata
  signup_code := NEW.raw_user_meta_data->>'signup_code';
  
  -- Log for debugging
  RAISE LOG 'Processing signup: Email=%, Code=%', 
    NEW.email, 
    signup_code;
    
  -- Only update signup code if it's provided
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
