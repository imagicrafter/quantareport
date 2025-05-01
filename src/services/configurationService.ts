
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSettings {
  require_signup_code: boolean;
  [key: string]: any;
}

/**
 * Fetches application settings from the database
 * @returns The application settings
 */
export const getAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'signup_requirements')
      .single();

    if (error) {
      console.error('Error fetching app settings:', error);
      return null;
    }

    return data?.value as AppSettings;
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return null;
  }
};

/**
 * Updates the signup code requirement setting
 * @param requireSignupCode Whether signup codes should be required for registration
 * @returns Whether the update was successful
 */
export const updateSignupRequirement = async (requireSignupCode: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('app_settings')
      .update({
        value: { require_signup_code: requireSignupCode }
      })
      .eq('key', 'signup_requirements');

    if (error) {
      console.error('Error updating signup requirement:', error);
      toast.error('Failed to update signup code requirement');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating signup requirement:', error);
    toast.error('Failed to update signup code requirement');
    return false;
  }
};

