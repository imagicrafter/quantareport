
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NavBar from '../components/layout/NavBar';
import Button from '../components/ui-elements/Button';

const industries = [
  { id: 'engineering', name: 'Engineering' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'construction', name: 'Construction' },
  { id: 'appraisals', name: 'Appraisals' },
  { id: 'small-business', name: 'Small Business' },
  { id: 'other', name: 'Other' },
];

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'free';
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [plan, setPlan] = useState(planFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      // Validate first step
      if (!email || !password) {
        setError('Please fill in all fields');
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
  
  const handleSubmit = () => {
    setIsLoading(true);
    
    // Simulating registration
    setTimeout(() => {
      setIsLoading(false);
      // For now, just log the registration data
      console.log('Sign up with:', { email, password, name, phone, industry, plan });
      // In a real app, you would create the user account and redirect on success
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-muted-foreground">Sign up for Reportify to get started</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleNextStep} className="space-y-6">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
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
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 rounded-md border border-input bg-background"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 rounded-md border border-input bg-background"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="industry" className="text-sm font-medium">
                      Industry
                    </label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full p-2 rounded-md border border-input bg-background"
                      required
                    >
                      <option value="" disabled>
                        Select your industry
                      </option>
                      {industries.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      This helps us personalize your templates
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="plan" className="text-sm font-medium">
                      Subscription Plan
                    </label>
                    <select
                      id="plan"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full p-2 rounded-md border border-input bg-background"
                      required
                    >
                      <option value="free">Free Demo</option>
                      <option value="pro">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </>
              )}
              
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                {step === 1 ? 'Continue' : 'Create Account'}
              </Button>
              
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
            </form>

            {step === 1 && (
              <>
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
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      Facebook
                    </Button>
                  </div>
                </div>
                
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/signin" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
