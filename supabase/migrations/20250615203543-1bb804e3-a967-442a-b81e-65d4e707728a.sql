
-- Step 1: Add the 'subscribed' column to the profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscribed BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Create a function to update the profile when a subscription is created
CREATE OR REPLACE FUNCTION public.set_profile_subscribed_on_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a new subscription is added, mark the user's profile as subscribed.
  UPDATE public.profiles
  SET subscribed = TRUE
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Step 3: Create a trigger to execute the function after a user subscription is inserted
DROP TRIGGER IF EXISTS on_user_subscription_created ON public.user_subscriptions;
CREATE TRIGGER on_user_subscription_created
AFTER INSERT ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_subscribed_on_subscription();

-- Step 4: Update the handle_new_user function to no longer create subscriptions automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- This function is triggered when a new user signs up in auth.users.
  -- It creates a corresponding profile in public.profiles.
  -- The `subscribed` column on the new profile will default to FALSE.
  -- It NO LONGER creates a default subscription. The user must complete the full registration process for that.
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, email, phone)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        NEW.raw_user_meta_data->>'phone'
    );
  -- This logic handles updates to user metadata from an OAuth provider after initial signup
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
$function$
