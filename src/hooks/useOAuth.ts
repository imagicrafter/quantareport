
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
        const requireCodes = settings?.require_signup_code || false;
        setRequiresSignupCode(requireCodes);
        console.log('OAuth hook - Signup codes required:', requireCodes);
      } catch (err) {
        console.error('Error checking signup requirements:', err);
        // Default to NOT requiring signup codes
        setRequiresSignupCode(false);
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
    try {
      sessionStorage.setItem(OAUTH_SIGNUP_SESSION_KEY, JSON.stringify(signupInfo));
      console.log('Saved OAuth signup info to session storage:', signupInfo);
    } catch (err) {
      console.error('Failed to save OAuth info to session storage:', err);
    }
  };

  // Helper function to validate signup code before OAuth
  const validateSignupCodeBeforeOAuth = async (email: string, code: string): Promise<boolean> => {
    if (!requiresSignupCode) {
      console.log('Signup codes not required, proceeding with OAuth');
      return true;
    }

    if (!code) {
      setError('Signup code is required');
      return false;
    }

    try {
      const validation = await validateSignupCode(code, email);
      if (!validation.valid) {
        setError(validation.message);
        return false;
      }
      
      // Save validated info for OAuth callback
      saveOAuthSignupInfo(email, code);
      return true;
    } catch (err) {
      console.error('Error validating signup code:', err);
      setError('Error validating signup code');
      return false;
    }
  };

  const handleGoogleSignUp = async (email?: string, signupCode?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Validate signup code if required and provided
      if (email && signupCode) {
        const isValid = await validateSignupCodeBeforeOAuth(email, signupCode);
        if (!isValid) {
          setIsLoading(false);
          return;
        }
      } else if (requiresSignupCode) {
        setError('Email and signup code are required');
        setIsLoading(false);
        return;
      }
      
      // Set up the metadata to include in the OAuth request
      const options: any = {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      };

      // Add signup code to query params if provided
      if (email && signupCode) {
        options.queryParams.signup_code = signupCode;
        options.queryParams.email = email;
      }
      
      console.log('Redirecting with origin:', window.location.origin, 'to', options.redirectTo);
      console.log('OAuth options:', options);
      
      // Get the URL for Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options
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
      // Validate signup code if required and provided
      if (email && signupCode) {
        const isValid = await validateSignupCodeBeforeOAuth(email, signupCode);
        if (!isValid) {
          setIsLoading(false);
          return;
        }
      } else if (requiresSignupCode) {
        setError('Email and signup code are required');
        setIsLoading(false);
        return;
      }
      
      // Set up the metadata to include in the OAuth request
      const options: any = {
        redirectTo: `${window.location.origin}/dashboard`,
      };

      // Add signup code to query params if provided
      if (email && signupCode) {
        options.queryParams = {
          signup_code: signupCode,
          email: email
        };
      }
      
      console.log('Redirecting with origin:', window.location.origin, 'to', options.redirectTo);
      console.log('OAuth options:', options);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options
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
