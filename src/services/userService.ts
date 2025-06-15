
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if a user with the given email is already fully registered.
 * A user is considered registered if they have an entry in the user_subscriptions table.
 * @param email The email to check.
 * @returns An object with `isRegistered` and an optional `error` message.
 */
export const checkRegistrationStatus = async (email: string): Promise<{ isRegistered: boolean; error: string | null }> => {
  if (!email) {
    return { isRegistered: false, error: 'Email is required.' };
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, user_subscriptions(user_id)')
      .eq('email', email)
      .single();

    // `PGRST116` is "No rows found", which is not an error in this context. It means the user doesn't exist.
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile for registration check:', error);
      return { isRegistered: false, error: 'Could not verify email. Please try again.' };
    }

    // If profile exists and has a subscription, they are registered.
    if (profile && Array.isArray(profile.user_subscriptions) && profile.user_subscriptions.length > 0) {
      console.log(`User with email ${email} is already registered.`);
      return { isRegistered: true, error: null };
    }

    // If profile exists but no subscription, or no profile at all, they are not registered.
    console.log(`User with email ${email} is not yet registered.`);
    return { isRegistered: false, error: null };

  } catch (err: any) {
    console.error('Unexpected error in checkRegistrationStatus:', err);
    return { isRegistered: false, error: 'An unexpected error occurred. Please try again.' };
  }
};
