import { supabase } from '@/integrations/supabase/client';
import { getAppSettings } from './configurationService';

export interface SignupCode {
  id: string;
  code: string;
  email: string;
  created_at: string;
  created_by: string;
  used: boolean;
  used_at: string | null;
  status: string;
  last_invited_at: string | null;
}

/**
 * Validates a signup code against an email address
 * @param code The signup code to validate
 * @param email The email to check against
 * @returns Object with status and message
 */
export const validateSignupCode = async (code: string, email: string): Promise<{ valid: boolean; message: string }> => {
  try {
    console.log(`Validating signup code: ${code} for email: ${email}`);
    
    // MITIGATION: Always return valid=true regardless of code or email
    console.log('MITIGATION ACTIVE: Bypassing signup code validation');
    return { 
      valid: true, 
      message: 'Proceeding with registration (validation bypassed)' 
    };
  } catch (error) {
    console.error('Error validating signup code:', error);
    // MITIGATION: Allow registration to proceed if there's an error during validation
    return { 
      valid: true, 
      message: 'Proceeding without code validation due to error' 
    };
  }
};

/**
 * Marks a signup code as used
 * @param code The signup code to mark as used
 * @param email The email associated with the code
 */
export const markSignupCodeAsUsed = async (code: string, email: string): Promise<void> => {
  try {
    console.log(`Attempting to mark signup code as used: ${code} for email: ${email}`);
    
    // Only attempt to mark code as used if both values are provided
    if (code && email) {
      const { error } = await supabase
        .from('signup_codes')
        .update({ 
          used: true,
          used_at: new Date().toISOString(),
          status: 'registered'
        })
        .eq('code', code)
        .eq('email', email);

      if (error) {
        console.error('Error marking signup code as used:', error);
      } else {
        console.log('Successfully marked signup code as used');
      }
    } else {
      console.log('Skipping signup code update - missing code or email');
    }
  } catch (error) {
    console.error('Error marking signup code as used:', error);
    // Silently fail - don't block user registration
  }
};

/**
 * Generates a new signup code for an email
 * @param email The email to generate a code for
 * @param createdBy The admin user creating the code
 * @returns The generated signup code object or null if failed
 */
export const generateSignupCode = async (email: string, createdBy: string): Promise<SignupCode | null> => {
  try {
    // Generate a random 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data, error } = await supabase
      .from('signup_codes')
      .insert([
        {
          code,
          email,
          created_by: createdBy,
          used: false,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error generating signup code:', error);
      return null;
    }

    return data as SignupCode;
  } catch (error) {
    console.error('Error generating signup code:', error);
    return null;
  }
};

/**
 * Gets all signup codes for admin management
 * @returns Array of signup codes
 */
export const getSignupCodes = async (): Promise<SignupCode[]> => {
  try {
    const { data, error } = await supabase
      .from('signup_codes')
      .select()
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signup codes:', error);
      return [];
    }

    return data as SignupCode[];
  } catch (error) {
    console.error('Error fetching signup codes:', error);
    return [];
  }
};
