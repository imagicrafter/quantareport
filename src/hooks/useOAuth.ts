
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { validateSignupCode } from '@/services/signupCodeService';
import { getAppSettings } from '@/services/configurationService';

// Define a session storage key for storing validated signup info
const OAUTH_SIGNUP_SESSION_KEY = 'oauth_signup_info';

interface OAuthSignupInfo {
  email: string;
  code: string;
  validated: boolean;
}

export const useOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresSignupCode, setRequiresSignupCode] = useState<boolean | null>(null);
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);

  // Check if signup codes are required on component mount
  useEffect(() => {
    const checkSignupRequirements = async () => {
      try {
        setIsCheckingSettings(true);
        const settings = await getAppSettings();
        setRequiresSignupCode(settings?.require_signup_code ?? true);
        console.log('OAuth hook - Signup codes required:', settings?.require_signup_code);
      } catch (err) {
        console.error('Error checking signup requirements:', err);
        // Default to requiring signup codes for security if we can't check
        setRequiresSignupCode(true);
      } finally {
        setIsCheckingSettings(false);
      }
    };

    checkSignupRequirements();
  }, []);

  // Helper function to save validated signup info to session storage
  const saveOAuthSignupInfo = (email: string, code: string) => {
    const signupInfo: OAuthSignupInfo = {
      email,
      code,
      validated: true
    };
    sessionStorage.setItem(OAUTH_SIGNUP_SESSION_KEY, JSON.stringify(signupInfo));
  };

  // Helper function to validate signup code before OAuth
  const validateSignupCodeBeforeOAuth = async (email: string, code: string): Promise<boolean> => {
    if (!requiresSignupCode) {
      // If signup codes aren't required, proceed without validation
      return true;
    }

    // Validate the signup code
    const validationResult = await validateSignupCode(code, email);
    
    if (validationResult.valid) {
      // Store the validated signup info in session storage
      saveOAuthSignupInfo(email, code);
      return true;
    } else {
      toast.error(validationResult.message || 'Invalid signup code');
      return false;
    }
  };

  const handleGoogleSignUp = async (email?: string, signupCode?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // If signup codes are required, validate email and code first
      if (requiresSignupCode && email && !signupCode) {
        throw new Error('A signup code is required');
      }
      
      // Validate signup code if provided
      if (requiresSignupCode && email && signupCode) {
        const isValid = await validateSignupCodeBeforeOAuth(email, signupCode);
        if (!isValid) {
          setIsLoading(false);
          return;
        }
      }
      
      // Log the origin to help debugging
      console.log('Redirecting with origin:', window.location.origin);
      
      // Get the URL for Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google sign up error details:', error);
        throw error;
      }
      
      console.log('Google sign up initiated, URL received:', data?.url);
      
      if (data?.url) {
        // Force navigation to the top frame and clear the URL to prevent any caching issues
        window.top.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned from Supabase');
      }
      
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(err.message || 'An error occurred during Google sign up');
      toast.error(err.message || 'Failed to sign up with Google');
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async (email?: string, signupCode?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // If signup codes are required, validate email and code first
      if (requiresSignupCode && email && !signupCode) {
        throw new Error('A signup code is required');
      }
      
      // Validate signup code if provided
      if (requiresSignupCode && email && signupCode) {
        const isValid = await validateSignupCodeBeforeOAuth(email, signupCode);
        if (!isValid) {
          setIsLoading(false);
          return;
        }
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
      
      console.log('Facebook sign up initiated:', data);
      
      if (data?.url) {
        // Force navigation to the top frame
        window.top.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned from Supabase');
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during Facebook sign up');
      toast.error(err.message || 'Failed to sign up with Facebook');
      console.error('Facebook sign up error:', err);
      setIsLoading(false);
    }
  };

  return {
    isOAuthLoading: isLoading,
    isCheckingSettings,
    requiresSignupCode,
    oAuthError: error,
    handleGoogleSignUp,
    handleFacebookSignUp,
    setOAuthError: setError
  };
};
