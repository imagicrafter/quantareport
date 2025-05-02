
CREATE OR REPLACE FUNCTION public.handle_signup_code_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  require_signup_code BOOLEAN;
BEGIN
  -- Check if signup codes are required
  SELECT (value->>'require_signup_code')::BOOLEAN INTO require_signup_code 
  FROM app_settings 
  WHERE key = 'signup_requirements' 
  LIMIT 1;
  
  -- Only update signup code if it's provided and either required or explicitly provided
  IF (NEW.raw_user_meta_data->>'signup_code' IS NOT NULL) AND 
     (require_signup_code OR NEW.raw_user_meta_data->>'signup_code' != '') THEN
    
    UPDATE public.signup_codes
    SET 
      used = true,
      used_at = NOW(),
      status = 'registered'
    WHERE 
      code = NEW.raw_user_meta_data->>'signup_code'
      AND email = NEW.email
      AND used = false;
  END IF;
  
  RETURN NEW;
END;
$function$;
