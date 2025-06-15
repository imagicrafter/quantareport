import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { getAppSettings } from '@/services/configurationService';
import { validateSignupPrerequisites } from '@/services/authValidationService';

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
    setError(''); // Clear previous errors

    const validation = await validateSignupPrerequisites(email, code);

    if (!validation.valid) {
      setError(validation.message);
      return false;
    }
    
    // Always save info to session storage to handle on callback
    saveOAuthSignupInfo(email, code);
    return true;
  };

  const performOAuth = async (
    provider: 'google' | 'facebook',
    flow: 'signup' | 'signin',
    email?: string,
    signupCode?: string
  ) => {
    setError('');
    setIsLoading(true);

    try {
      if (flow === 'signup') {
        const isValid = await validateSignupCodeBeforeOAuth(email || '', signupCode || '');
        if (!isValid) {
          setIsLoading(false);
          return;
        }
      } else {
        // For sign-in, ensure any lingering signup info is cleared as a safeguard.
        sessionStorage.removeItem('oauth_signup_info');
      }

      const options = {
        redirectTo: `${window.location.origin}/${flow === 'signup' ? 'signup' : 'dashboard'}`,
      };

      console.log(`Initiating ${provider} ${flow} flow...`, options);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({ provider, options });

      if (oauthError) {
        console.error(`${provider} ${flow} error details:`, oauthError);
        throw oauthError;
      }

      if (data?.url) {
        console.log(`${provider} ${flow} initiated, redirecting to:`, data.url);
        window.top.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned from Supabase');
      }
    } catch (err: any) {
      const message = err.message || `An error occurred during ${provider} ${flow}`;
      console.error(`${provider} ${flow} error:`, err);
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async (email?: string, signupCode?: string) => {
    await performOAuth('google', 'signup', email, signupCode);
  };
  
  const handleFacebookSignUp = async (email?: string, signupCode?: string) => {
    await performOAuth('facebook', 'signup', email, signupCode);
  };

  const handleGoogleSignIn = async () => {
    await performOAuth('google', 'signin');
  };

  const handleFacebookSignIn = async () => {
    await performOAuth('facebook', 'signin');
  };

  return {
    isOAuthLoading: isLoading,
    isCheckingSettings,
    requiresSignupCode,
    oAuthError: error,
    handleGoogleSignUp,
    handleFacebookSignUp,
    handleGoogleSignIn,
    handleFacebookSignIn,
    setOAuthError: setError,
  };
};
