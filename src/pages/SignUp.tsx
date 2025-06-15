
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { useOAuth } from '../hooks/useOAuth';
import { industries } from '../data/industries';
import SignUpContainer from '../components/auth/SignUpContainer';
import SignUpStep1Form from '../components/auth/SignUpStep1Form';
import SignUpStep2Form from '../components/auth/SignUpStep2Form';
import { validateSignupCode } from '@/services/signupCodeService';
import { validateSignupPrerequisites } from '@/services/authValidationService';

const OAUTH_SIGNUP_SESSION_KEY = 'oauth_signup_info';

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'free';
  const codeFromUrl = searchParams.get('code') || '';
  const emailFromUrl = searchParams.get('email') || '';
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [signUpCode, setSignUpCode] = useState(codeFromUrl);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [plan, setPlan] = useState(planFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOAuthCompletion, setIsOAuthCompletion] = useState(false);
  
  const { 
    handleGoogleSignUp, 
    handleFacebookSignUp, 
    isOAuthLoading,
    requiresSignupCode,
    isCheckingSettings,
    oAuthError,
    setOAuthError
  } = useOAuth();
  
  useEffect(() => {
    const checkOAuthCompletion = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Not an OAuth callback, not logged in. Do nothing.
        return;
      }

      // User is logged in. Check if it's part of an OAuth signup flow.
      const signupInfoRaw = sessionStorage.getItem(OAUTH_SIGNUP_SESSION_KEY);

      if (signupInfoRaw) {
        // We are in an OAuth signup flow.
        console.log('Detected OAuth profile completion flow.');
        const user = session.user;

        // Check if the required fields for step 2 are already filled.
        const isProfileComplete = user.user_metadata?.phone && user.user_metadata?.industry;

        if (isProfileComplete) {
          // This can happen if an existing user with a complete profile re-triggers the signup flow.
          // It's safe to just send them to the dashboard.
          console.log('OAuth user profile is already complete. Cleaning up and redirecting to dashboard.');
          sessionStorage.removeItem(OAUTH_SIGNUP_SESSION_KEY);
          navigate('/dashboard');
          return;
        }

        // Profile is not complete, proceed to Step 2 to gather more details.
        console.log('Profile is incomplete. Proceeding to Step 2.');
        
        const signupInfo = JSON.parse(signupInfoRaw);
        
        setIsOAuthCompletion(true);
        setEmail(user.email || signupInfo.email || '');
        // Google can provide 'full_name' or 'name', so check both
        setName(user.user_metadata.full_name || user.user_metadata.name || ''); 
        setSignUpCode(signupInfo.code || '');
        setStep(2);

      } else {
        // User is logged in but not in an OAuth signup flow (no session storage item).
        // This means an existing user navigated to /signup. Redirect them.
        console.log('Logged-in user accessed /signup directly. Redirecting to dashboard.');
        navigate('/dashboard');
      }
    };

    checkOAuthCompletion();
  }, [navigate]);

  useEffect(() => {
    if (codeFromUrl && emailFromUrl && !isOAuthCompletion) {
      const validateCodeFromUrl = async () => {
        if (requiresSignupCode === null) return;
        if (!requiresSignupCode) return;
        
        try {
          setIsLoading(true);
          const validation = await validateSignupCode(codeFromUrl, emailFromUrl);
          if (!validation.valid) {
            setError(validation.message);
          }
        } catch (err) {
          console.error('Error validating code from URL:', err);
          setError('Error validating signup code');
        } finally {
          setIsLoading(false);
        }
      };
      validateCodeFromUrl();
    }
  }, [codeFromUrl, emailFromUrl, requiresSignupCode, isOAuthCompletion]);
  
  const isSubmitting = isLoading || isOAuthLoading || isCheckingSettings;
  
  useEffect(() => {
    if (oAuthError && !error) {
      setError(oAuthError);
    }
  }, [oAuthError, error]);
  
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!email || !password) {
        setError('Please fill in all required fields');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (requiresSignupCode && !signUpCode) {
        setError('Signup code is required');
        return;
      }

      setIsLoading(true);
      try {
        const validation = await validateSignupPrerequisites(email, signUpCode);
        if (validation.status === 'VALIDATION_PASSED') {
          // All checks passed for a new user, move to next step
          setStep(2);
        } else {
          // This will catch ALREADY_REGISTERED, VALIDATION_FAILED, and SYSTEM_ERROR
          // The message from the service is user-friendly.
          setError(validation.message);
        }
      } catch (err: any) {
        console.error('Error during signup step 1 validation:', err);
        setError(err.message || 'An error occurred during validation.');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      if (!name || !phone || !industry) {
        setError('Please fill in all required fields');
        return;
      }
      handleSubmit();
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Could not get user. Please sign in again.");

      const metadata: Record<string, any> = {
        full_name: name,
        phone,
        industry,
        plan
      };
      
      if (signUpCode) {
        metadata.signup_code = signUpCode;
      }

      const { error: updateError } = await supabase.auth.updateUser({ data: metadata });
      if (updateError) throw updateError;
      
      // The database trigger 'on_auth_user_change_handle_signup_code' now handles this automatically.
      // The manual call to markSignupCodeAsUsed is removed to rely on the trigger.
      console.log('Profile updated. The backend trigger will handle the signup code.');

      sessionStorage.removeItem(OAUTH_SIGNUP_SESSION_KEY);
      toast.success('Profile completed successfully!');
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'An error occurred during profile update.');
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailSignUp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const metadata: Record<string, any> = {
        full_name: name,
        phone,
        industry,
        plan,
        signup_code: signUpCode || undefined
      };
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (signUpError) throw signUpError;
      
      console.log('Sign up process initiated.');

      if (data.user && !data.session) {
        // This case occurs when email confirmation is required.
        console.log('Account created, verification email will be sent.');
        toast.success('Account created! Please check your email for a verification link to complete your registration.');
        // Stay on page. User needs to verify email, then they can sign in.
      } else if (data.user && data.session) {
        // This case occurs when email confirmation is NOT required.
        console.log('Account created and user logged in (email confirmation disabled). The backend trigger will handle the signup code.');
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        // Fallback for unexpected response from Supabase.
        throw new Error('An unexpected issue occurred during signup. Please try again.');
      }
      
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'An error occurred during sign up');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isOAuthCompletion) {
      await handleProfileUpdate();
    } else {
      await handleEmailSignUp();
    }
  };

  return (
    <SignUpContainer error={error} step={step} isOAuthCompletion={isOAuthCompletion}>
      {isCheckingSettings ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading settings...</p>
        </div>
      ) : step === 1 ? (
        <SignUpStep1Form
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          signUpCode={signUpCode}
          setSignUpCode={setSignUpCode}
          handleNextStep={handleNextStep}
          error={error}
          isLoading={isSubmitting}
          handleGoogleSignUp={handleGoogleSignUp}
          handleFacebookSignUp={handleFacebookSignUp}
          requiresSignupCode={requiresSignupCode}
        />
      ) : (
        <SignUpStep2Form
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          industry={industry}
          setIndustry={setIndustry}
          plan={plan}
          setPlan={setPlan}
          handleNextStep={handleNextStep}
          setStep={setStep}
          isLoading={isSubmitting}
          industries={industries}
        />
      )}
    </SignUpContainer>
  );
};

export default SignUp;
