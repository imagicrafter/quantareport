import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if a user with the given email is already fully registered.
 * A user is considered registered if their profile's 'subscribed' flag is true.
 * @param email The email to check.
 * @returns An object with `isRegistered` and an optional `error` message.
 */
export const checkRegistrationStatus = async (email: string): Promise<{ isRegistered: boolean; error: string | null }> => {
  if (!email) {
    return { isRegistered: false, error: 'Email is required.' };
  }

  try {
    // The 'subscribed' column was added via migration.
    // The auto-generated types might not reflect this yet.
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscribed')
      .eq('email', email)
      .single();

    // `PGRST116` is "No rows found", which is not an error in this context. It means the user doesn't exist.
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile for registration check:', error);
      return { isRegistered: false, error: 'Could not verify email. Please try again.' };
    }

    if (profile?.subscribed) {
      console.log(`User with email ${email} is already registered (subscribed).`);
      return { isRegistered: true, error: null };
    }

    console.log(`User with email ${email} is not yet registered (not subscribed).`);
    return { isRegistered: false, error: null };

  } catch (err: any) {
    console.error('Unexpected error in checkRegistrationStatus:', err);
    return { isRegistered: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

/**
 * Creates a subscription record for a new user.
 * @param userId The user's ID.
 * @param subscriptionId The ID of the subscription plan.
 * @returns An object with an optional `error` message.
 */
export const createUserSubscription = async (userId: string, subscriptionId: string): Promise<{ error: string | null }> => {
  try {
    if (!userId || !subscriptionId) {
      return { error: 'User ID and subscription plan ID are required.' };
    }

    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        status: 'active'
      });
    
    if (insertError) {
      console.error('Error creating user subscription:', insertError);
      throw new Error('Failed to create subscription for the user.');
    }

    console.log(`Successfully created subscription for user ${userId} with plan ID ${subscriptionId}`);
    return { error: null };

  } catch (err: any) {
    console.error('Unexpected error in createUserSubscription:', err);
    return { error: err.message || 'An unexpected error occurred while creating the subscription.' };
  }
};
