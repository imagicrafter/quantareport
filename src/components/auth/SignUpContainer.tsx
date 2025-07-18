
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../layout/NavBar';

interface SignUpContainerProps {
  children: ReactNode;
  error?: string;
  step: number;
  isOAuthCompletion?: boolean;
}

const SignUpContainer = ({ children, error, step, isOAuthCompletion }: SignUpContainerProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {isOAuthCompletion ? 'Complete Your Profile' : 'Create your account'}
              </h1>
              <p className="text-muted-foreground">
                {isOAuthCompletion
                  ? 'Just a few more details to get you started'
                  : 'Sign up for QuantaReport to get started'}
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            
            {children}
            
            {step === 1 && !isOAuthCompletion && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpContainer;
