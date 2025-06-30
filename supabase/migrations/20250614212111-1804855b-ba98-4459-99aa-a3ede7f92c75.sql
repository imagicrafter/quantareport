
-- Enable the pg_net extension for making HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- This function will be called by the Supabase Auth "Send Email hook"
CREATE OR REPLACE FUNCTION public.send_custom_email(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path
SET search_path = public, extensions
AS $$
DECLARE
  email_type TEXT;
  user_email TEXT;
  token_hash TEXT;
  redirect_to TEXT;
  confirmation_link TEXT;
  -- For production, this should come from a config table like 'app_settings'
  site_url TEXT := 'https://quantareport.com'; 
  response net.http_response_result;
  -- The public anon key is used here since the edge function is not protected by JWT verification
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0YXVmbnh3b3J6dG9sZmR3bGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODIwMjUsImV4cCI6MjA1NjQ1ODAyNX0.O_Xg5cLp8x5FMQIYJKQKBCY8FC37AeJ5ffOhyEZ_yqg';
BEGIN
  email_type := payload->>'type';

  -- We are only customizing the 'signup' confirmation email for now
  IF email_type = 'signup' THEN
    user_email := payload->'data'->'user'->>'email';
    token_hash := payload->'data'->'email_data'->>'token_hash';
    redirect_to := payload->'data'->'email_data'->>'redirect_to';

    -- Construct the full verification link
    confirmation_link := site_url || '/auth/v1/verify?token=' || token_hash || '&type=signup&redirect_to=' || redirect_to;

    -- Invoke the 'send-signup-invite' edge function using pg_net
    SELECT * INTO response FROM net.http_post(
        url := 'https://vtaufnxworztolfdwlll.supabase.co/functions/v1/send-signup-invite',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', anon_key,
            'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'emailType', 'CONFIRMATION',
          'recipientEmail', user_email,
          'confirmationLink', confirmation_link
        )
    );

    -- If the function call fails, we'll let Supabase send its default email
    IF response.status_code <> 200 THEN
      RAISE WARNING 'send_custom_email hook: Failed to invoke send-signup-invite function. Status: %, Body: %', response.status_code, response.body;
      RETURN '{}'::jsonb;
    END IF;
    
    -- On success, we tell Supabase to NOT send its default email
    RETURN '{"should_send_email": false}'::jsonb;
  END IF;

  -- For all other email types, do nothing and let Supabase handle them
  RETURN '{}'::jsonb;
END;
$$;

-- Grant necessary permissions for Supabase's auth service
GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.send_custom_email(jsonb) TO supabase_auth_admin;
