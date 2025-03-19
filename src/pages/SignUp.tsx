
import { useState } from 'react';
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
  
  const { 
    handleGoogleSignUp, 
    handleFacebookSignUp, 
    isOAuthLoading,
    oAuthError
  } = useOAuth();
  
  // Combine loading states
  const isSubmitting = isLoading || isOAuthLoading;
  
  // Combine error states
  if (oAuthError && !error) {
    setError(oAuthError);
  }
  
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      // Validate first step
      if (!email || !password || !signUpCode) {
        setError('Please fill in all fields');
        return;
      }
      
      // Validate signup code
      setIsLoading(true);
      const isValid = await validateSignupCode(signUpCode, email);
      setIsLoading(false);
      
      if (!isValid) {
        setError('Invalid signup code or email combination');
        return;
      }
      
      setStep(2);
    } else if (step === 2) {
      // Validate second step and submit
      if (!name || !phone || !industry) {
        setError('Please fill in all fields');
        return;
      }
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            industry,
            plan
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      // Mark the signup code as used and update status to active
      await markSignupCodeAsUsed(signUpCode, email);
      
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
