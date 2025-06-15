
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { useOAuth } from '../hooks/useOAuth';
import { industries } from '../data/industries';
import SignUpContainer from '../components/auth/SignUpContainer';
import SignUpStep1Form from '../components/auth/SignUpStep1Form';
import SignUpStep2Form from '../components/auth/SignUpStep2Form';
import { validateSignupCode, markSignupCodeAsUsed } from '@/services/signupCodeService';

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
      const signupInfoRaw = sessionStorage.getItem(OAUTH_SIGNUP_SESSION_KEY);

      if (session && signupInfoRaw) {
        console.log('Detected OAuth profile completion flow.');
        const user = session.user;

        if (user.user_metadata?.phone && user.user_metadata?.industry) {
          console.log('OAuth user profile is complete. Redirecting to dashboard.');
          sessionStorage.removeItem(OAUTH_SIGNUP_SESSION_KEY);
          navigate('/dashboard');
          return;
        }

        const isExistingUser = new Date().getTime() - new Date(user.created_at).getTime() > 5 * 60 * 1000; // 5 minute threshold

        if (isExistingUser) {
          console.log('Existing user with incomplete profile landed on OAuth signup. Redirecting to dashboard to avoid confusion.');
          sessionStorage.removeItem(OAUTH_SIGNUP_SESSION_KEY);
          navigate('/dashboard');
          return;
        }

        setIsOAuthCompletion(true);
        const signupInfo = JSON.parse(signupInfoRaw);
        
        setEmail(user.email || signupInfo.email || '');
        setName(user.user_metadata.full_name || '');
        setSignUpCode(signupInfo.code || '');
        setStep(2);
      } else if (session) {
        console.log('Logged-in user accessed /signup, redirecting to dashboard.');
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
      
      if (requiresSignupCode && signUpCode) {
        try {
          setIsLoading(true);
          const validation = await validateSignupCode(signUpCode, email);
          if (!validation.valid) {
            setError(validation.message);
            return;
          }
        } catch (err) {
          setError('Error validating signup code');
          return;
        } finally {
          setIsLoading(false);
        }
      }
      setStep(2);
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
      
      if (signUpCode && email) {
        try {
          await markSignupCodeAsUsed(signUpCode, email);
          console.log('Signup code marked as used for OAuth user.');
        } catch (codeError) {
          console.error('Failed to mark signup code as used:', codeError);
        }
      }

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
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (signUpCode) {
        try {
          await markSignupCodeAsUsed(signUpCode, email);
          console.log('Signup code marked as used');
        } catch (codeError) {
          console.error('Failed to mark signup code as used:', codeError);
        }
      }
      
      toast.success('Account created successfully! Please check your email for a verification link.');
      // The user will be redirected to the dashboard after email verification.
      
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
