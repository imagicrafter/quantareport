
import { supabase } from '@/integrations/supabase/client';

export interface SignupCode {
  id: string;
  code: string;
  email: string;
  created_at: string;
  created_by: string;
  used: boolean;
  used_at: string | null;
  status: string;
}

/**
 * Validates a signup code against an email address
 * @param code The signup code to validate
 * @param email The email to check against
 * @returns Boolean indicating if the code is valid for the email
 */
export const validateSignupCode = async (code: string, email: string): Promise<boolean> => {
  try {
    // Use the any type to work around type constraints
    const { data, error } = await supabase
      .from('signup_codes' as any)
      .select()
      .eq('code', code)
      .eq('email', email)
      .eq('used', false)
      .single();

    if (error || !data) {
      console.error('Error validating signup code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating signup code:', error);
    return false;
  }
};

/**
 * Marks a signup code as used
 * @param code The signup code to mark as used
 * @param email The email associated with the code
 */
export const markSignupCodeAsUsed = async (code: string, email: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('signup_codes' as any)
      .update({ 
        used: true,
        used_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('code', code)
      .eq('email', email);

    if (error) {
      console.error('Error marking signup code as used:', error);
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
      .from('signup_codes' as any)
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

    return data as unknown as SignupCode;
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
      .from('signup_codes' as any)
      .select()
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signup codes:', error);
      return [];
    }

    return data as unknown as SignupCode[];
  } catch (error) {
    console.error('Error fetching signup codes:', error);
    return [];
  }
};
