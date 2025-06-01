
import { Dispatch, FormEvent, SetStateAction } from 'react';
import Button from '../ui-elements/Button';

interface SignUpStep1FormProps {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  signUpCode: string;
  setSignUpCode: Dispatch<SetStateAction<string>>;
  handleNextStep: (e: FormEvent) => void;
  error: string;
  isLoading: boolean;
  handleGoogleSignUp: (email?: string, signupCode?: string) => Promise<void>;
  handleFacebookSignUp: (email?: string, signupCode?: string) => Promise<void>;
  requiresSignupCode?: boolean | null;
}

const SignUpStep1Form = ({
  email,
  setEmail,
  password,
  setPassword,
  signUpCode,
  setSignUpCode,
  handleNextStep,
  error,
  isLoading,
  handleGoogleSignUp,
  handleFacebookSignUp,
  requiresSignupCode = false
}: SignUpStep1FormProps) => {
  return (
    <form onSubmit={handleNextStep} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium block text-left">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded-md border border-input bg-background"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded-md border border-input bg-background"
          required
        />
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters
        </p>
      </div>
      
      {requiresSignupCode && (
        <div className="space-y-2">
          <label htmlFor="signUpCode" className="text-sm font-medium">
            Sign-up Code
          </label>
          <input
            id="signUpCode"
            type="text"
            value={signUpCode}
            onChange={(e) => setSignUpCode(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background"
            required={requiresSignupCode === true}
            placeholder="Enter your sign-up code"
          />
          <p className="text-xs text-muted-foreground">
            A sign-up code is required to register
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
      >
        Continue
      </Button>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleGoogleSignUp(email, signUpCode)}
            isLoading={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleFacebookSignUp(email, signUpCode)}
            isLoading={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            Facebook
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SignUpStep1Form;
