
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
    console.log('Fetching app settings');
    // Default settings - set to NOT require signup codes as failsafe
    const defaultSettings: AppSettings = {
      require_signup_code: false
    };

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'signup_requirements')
      .maybeSingle();

    if (error) {
      console.error('Error fetching app settings:', error);
      // Return default settings instead of null
      console.log('Returning default settings due to error');
      return defaultSettings;
    }

    console.log('App settings fetched:', data?.value);
    return data?.value as AppSettings || defaultSettings;
  } catch (error) {
    console.error('Error fetching app settings:', error);
    // Return default settings instead of null
    console.log('Returning default settings due to exception');
    return {
      require_signup_code: false
    };
  }
};

/**
 * Updates the signup code requirement setting
 * @param requireSignupCode Whether signup codes should be required for registration
 * @returns Whether the update was successful
 */
export const updateSignupRequirement = async (requireSignupCode: boolean): Promise<boolean> => {
  try {
    console.log('Updating signup requirement to:', requireSignupCode);
    
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

    console.log('Signup requirement updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating signup requirement:', error);
    toast.error('Failed to update signup code requirement');
    return false;
  }
};
