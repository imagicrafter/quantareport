import { Dispatch, FormEvent, SetStateAction } from 'react';
import Button from '../ui-elements/Button';
import { SubscriptionPlan } from '@/services/subscriptionService';

interface Industry {
  id: string;
  name: string;
}

interface SignUpStep2FormProps {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  industry: string;
  setIndustry: Dispatch<SetStateAction<string>>;
  plan: string;
  setPlan: Dispatch<SetStateAction<string>>;
  handleNextStep: (e: FormEvent) => void;
  setStep: Dispatch<SetStateAction<number>>;
  isLoading: boolean;
  industries: Industry[];
  subscriptions: SubscriptionPlan[];
}

const SignUpStep2Form = ({
  name,
  setName,
  phone,
  setPhone,
  industry,
  setIndustry,
  plan,
  setPlan,
  handleNextStep,
  setStep,
  isLoading,
  industries,
  subscriptions,
}: SignUpStep2FormProps) => {
  return (
    <form onSubmit={handleNextStep} className="space-y-6">
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
          disabled={subscriptions.length === 0 || isLoading}
        >
          {subscriptions.length === 0 ? (
            <option value="" disabled>
              Loading plans...
            </option>
          ) : (
            subscriptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))
          )}
        </select>
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
      >
        Create Account
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setStep(1)}
      >
        Back
      </Button>
    </form>
  );
};

export default SignUpStep2Form;
