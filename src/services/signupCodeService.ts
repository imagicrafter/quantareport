
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
    
    if (!code || !email) {
      console.log('Missing code or email for validation');
      return { valid: false, message: 'Signup code and email are required' };
    }
    
    // First check if signup codes are required at all
    const settings = await getAppSettings();
    
    // If signup codes are not required, bypass validation
    if (settings && settings.require_signup_code === false) {
      console.log('Signup codes not required, bypassing validation');
      return { valid: true, message: 'Signup code not required' };
    }
    
    // If we get here, signup codes are required or settings couldn't be loaded
    // (in case of error, we default to requiring codes for security)
    
    // Check if code exists and is unused
    const { data, error } = await supabase
      .from('signup_codes')
      .select()
      .eq('code', code)
      .eq('email', email)
      .eq('used', false)
      .eq('status', 'pending')
      .single();

    console.log('Signup code validation result:', { data, error });

    if (error || !data) {
      // Check if there's any code for this email at all
      const anyCodeResult = await supabase
        .from('signup_codes')
        .select()
        .eq('email', email)
        .single();
      
      console.log('Any code for email check result:', anyCodeResult);
      
      // Only access data properties if data exists (not error)
      if (!anyCodeResult.error && anyCodeResult.data) {
        const anyCodeData = anyCodeResult.data;
        
        if (anyCodeData.used) {
          return { 
            valid: false, 
            message: 'This signup code has already been used. Please contact support for assistance.' 
          };
        }
        
        if (anyCodeData.code !== code) {
          return { 
            valid: false, 
            message: 'Invalid signup code for this email address.' 
          };
        }
      }
      
      return { 
        valid: false, 
        message: 'Invalid signup code. Please email signup@inovy.ai to request participation in the beta program.' 
      };
    }

    return { valid: true, message: 'Signup code validated successfully' };
  } catch (error) {
    console.error('Error validating signup code:', error);
    return { 
      valid: false, 
      message: 'An error occurred while validating your signup code. Please try again.' 
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
    console.log(`Marking signup code as used: ${code} for email: ${email}`);
    
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
  } catch (error) {
    console.error('Error marking signup code as used:', error);
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
