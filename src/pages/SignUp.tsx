
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
import { getAppSettings } from '@/services/configurationService';

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'free';
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpCode, setSignUpCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [plan, setPlan] = useState(planFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresSignupCode, setRequiresSignupCode] = useState<boolean | null>(null);
  
  const { 
    handleGoogleSignUp, 
    handleFacebookSignUp, 
    isOAuthLoading,
    requiresSignupCode: oauthRequiresSignupCode,
    isCheckingSettings,
    oAuthError
  } = useOAuth();
  
  // Check if signup codes are required
  useEffect(() => {
    const checkSignupRequirements = async () => {
      try {
        const settings = await getAppSettings();
        setRequiresSignupCode(settings?.require_signup_code ?? true);
      } catch (err) {
        console.error('Error checking signup requirements:', err);
        // Default to requiring signup codes for security if we can't check
        setRequiresSignupCode(true);
      }
    };
    
    checkSignupRequirements();
  }, []);
  
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
      
      // Check if signup code is required
      if (requiresSignupCode && !signUpCode) {
        setError('A sign-up code is required');
        return;
      }
      
      // Validate password length
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      
      // Validate signup code if required
      if (requiresSignupCode) {
        setIsLoading(true);
        const validationResult = await validateSignupCode(signUpCode, email);
        setIsLoading(false);
        
        if (!validationResult.valid) {
          setError(validationResult.message);
          return;
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
    
    try {
      // If signup codes are required, validate one more time before registration
      if (requiresSignupCode) {
        const validationResult = await validateSignupCode(signUpCode, email);
        
        if (!validationResult.valid) {
          setError(validationResult.message);
          setIsLoading(false);
          return;
        }
      }
      
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
          data: metadata
        }
      });
      
      if (signUpError) throw signUpError;
      
      // Mark the signup code as used if provided
      if (signUpCode) {
        await markSignupCodeAsUsed(signUpCode, email);
      }
      
      toast.success('Account created successfully!');
      console.log('Signed up successfully:', data);
      
      // In a real app, you might want to redirect the user to a verification page
      // or directly to the dashboard if email verification is not required
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      toast.error(err.message || 'Failed to create account');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignUpContainer error={error} step={step}>
      {step === 1 ? (
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
