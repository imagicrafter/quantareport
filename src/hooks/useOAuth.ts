
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
      
      // CRITICAL: Always redirect using window.location.href to the URL from Supabase
      // This ensures we're doing a full page redirect rather than any iframe approach
      if (data?.url) {
        // Force navigation to the top frame
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
      
      console.log('Facebook sign up initiated:', data);
      
      // CRITICAL: Always redirect using window.location.href
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
    oAuthError: error,
    handleGoogleSignUp,
    handleFacebookSignUp,
    setOAuthError: setError
  };
};
