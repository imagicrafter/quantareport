
-- Step 1: Create the subscriptions table to store plan details
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    stripe_price_id text UNIQUE,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS to subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read subscription plans
CREATE POLICY "Allow authenticated read access"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (true);

-- Allow admin users to manage subscriptions
CREATE POLICY "Allow admin access"
ON public.subscriptions
FOR ALL
TO service_role
USING (true);


-- Step 2: Populate the subscriptions table with default plans
INSERT INTO public.subscriptions (name, description)
VALUES
    ('Free', 'Free plan with basic features'),
    ('Pro', 'Professional plan with advanced features'),
    ('Enterprise', 'Enterprise plan for large teams');


-- Step 3: Create the user_subscriptions table to link users to their plans
CREATE TABLE public.user_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id),
    status text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text UNIQUE,
    trial_start_at timestamp with time zone,
    trial_end_at timestamp with time zone,
    current_period_start_at timestamp with time zone,
    current_period_end_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add a trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_subscriptions_update
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_subscriptions_updated_at();

-- Add RLS to user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role to manage subscriptions
CREATE POLICY "Allow admin access for service role"
ON public.user_subscriptions
FOR ALL
TO service_role
USING (true);


-- Step 4: Migrate data from profiles table to user_subscriptions
-- This migration makes an assumption:
-- - If subscription_status is 'active', user is migrated to 'Pro' plan.
-- - Otherwise, user is migrated to 'Free' plan.
-- The status is carried over from `subscription_status`, defaulting to 'active' for new free users.
INSERT INTO public.user_subscriptions (user_id, subscription_id, status, stripe_customer_id, stripe_subscription_id)
SELECT
    p.id as user_id,
    (SELECT s.id FROM public.subscriptions s WHERE s.name =
        CASE
            WHEN p.subscription_status = 'active' THEN 'Pro'
            ELSE 'Free'
        END
    ) as subscription_id,
    COALESCE(p.subscription_status, 'active') as status,
    p.stripe_customer_id,
    p.stripe_subscription_id
FROM
    public.profiles p;


-- Step 5: Remove subscription-related columns from the profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS subscription_status;
