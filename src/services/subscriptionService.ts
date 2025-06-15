
import { supabase } from '@/integrations/supabase/client';

export interface UserSubscriptionDetails {
  planName: string;
  status: string;
  description: string | null;
  trial_end_at: string | null;
  current_period_end_at: string | null;
}

export const getUserSubscription = async (userId: string): Promise<UserSubscriptionDetails | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      status,
      trial_end_at,
      current_period_end_at,
      subscriptions (
        name,
        description
      )
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const subscription = data.subscriptions as { name: string; description:string | null } | null;

  return {
    planName: subscription?.name ?? 'Unknown',
    status: data.status,
    description: subscription?.description ?? 'Subscription plan details not found.',
    trial_end_at: data.trial_end_at,
    current_period_end_at: data.current_period_end_at,
  };
};
