
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_plan TEXT;
  subscription_id_to_set UUID;
  profile_phone TEXT;
  profile_industry TEXT;
  profile_plan TEXT;
BEGIN
  -- Insert into public.profiles, including new fields from metadata
  INSERT INTO public.profiles (id, full_name, avatar_url, email, phone)
  VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
  );

  -- Determine the plan from user metadata, default to 'Free'
  profile_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'Free');

  -- Find the subscription ID for the determined plan
  SELECT id INTO subscription_id_to_set
  FROM public.subscriptions
  WHERE name = profile_plan;
  
  -- If plan not found, default to Free plan's ID as a fallback.
  IF subscription_id_to_set IS NULL THEN
    SELECT id INTO subscription_id_to_set
    FROM public.subscriptions
    WHERE name = 'Free';
  END IF;

  -- Create a user_subscription entry
  IF subscription_id_to_set IS NOT NULL THEN
    INSERT INTO public.user_subscriptions(user_id, subscription_id, status)
    VALUES (NEW.id, subscription_id_to_set, 'active');
  END IF;

  RETURN NEW;
END;
$function$
