
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
  
  const { 
    handleGoogleSignUp, 
    handleFacebookSignUp, 
    isOAuthLoading,
    requiresSignupCode,
    isCheckingSettings,
    oAuthError,
    setOAuthError
  } = useOAuth();
  
  // Check URL parameters on load
  useEffect(() => {
    console.log('URL parameters:', { code: codeFromUrl, email: emailFromUrl });
    
    if (codeFromUrl && emailFromUrl) {
      // Pre-validate the signup code
      const validateCodeFromUrl = async () => {
        if (requiresSignupCode === null) return; // Wait until we know if codes are required
        
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
  }, [codeFromUrl, emailFromUrl, requiresSignupCode]);
  
  // Combine loading states
  const isSubmitting = isLoading || isOAuthLoading || isCheckingSettings;
  
  // Combine error states
  useEffect(() => {
    if (oAuthError && !error) {
      setError(oAuthError);
    }
  }, [oAuthError, error]);
  
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      // Validate first step
      if (!email || !password) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Validate password length
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      
      // Validate signup code if required
      if (requiresSignupCode && !signUpCode) {
        setError('Signup code is required');
        return;
      }
      
      if (signUpCode) {
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
      // Validate second step and submit
      if (!name || !phone || !industry) {
        setError('Please fill in all required fields');
        return;
      }
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Build user metadata
      const metadata: Record<string, any> = {
        full_name: name,
        phone,
        industry,
        plan
      };
      
      // Include signup code in metadata if provided
      if (signUpCode) {
        metadata.signup_code = signUpCode;
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (signUpError) throw signUpError;
      
      // Try to mark the signup code as used if provided, but don't block on failure
      if (signUpCode) {
        try {
          await markSignupCodeAsUsed(signUpCode, email);
          console.log('Signup code marked as used');
        } catch (codeError) {
          console.error('Failed to mark signup code as used:', codeError);
          // Don't block registration if this fails
        }
      }
      
      toast.success('Account created successfully!');
      console.log('Signed up successfully:', data);
      
      // In a real app, you might want to redirect the user to a verification page
      // or directly to the dashboard if email verification is not required
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'An error occurred during sign up');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignUpContainer error={error} step={step}>
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
