
import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

export const useOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Log the origin to help debugging
      console.log('Redirecting with origin:', window.location.origin);
      
      // This will redirect the browser to Google's authentication page
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
      
      // The redirect will happen automatically from Supabase
      // Google auth will happen in the top window, not in an iframe
      console.log('Google sign up initiated:', data);
      
      // Important: If we have a URL from the response, redirect to it directly
      // This ensures we're redirecting properly to Google's auth page
      if (data?.url) {
        window.location.href = data.url;
      }
      
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(err.message || 'An error occurred during Google sign up');
      toast.error(err.message || 'Failed to sign up with Google');
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
      
      // The redirect will happen automatically from Supabase
      console.log('Facebook sign up initiated:', data);
      
      // Important: If we have a URL from the response, redirect to it directly
      if (data?.url) {
        window.location.href = data.url;
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
    oAuthError: error,
    handleGoogleSignUp,
    handleFacebookSignUp,
    setOAuthError: setError
  };
};
