
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingTier = ({
  name,
  price,
  description,
  features,
  buttonText = 'Get Started',
  highlighted = false,
  link = '/signup',
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText?: string;
  highlighted?: boolean;
  link?: string;
}) => {
  return (
    <div
      className={`rounded-lg p-6 shadow-lg ${
        highlighted
          ? 'border-2 border-primary bg-white'
          : 'border border-border bg-card'
      }`}
    >
      <h3 className="text-xl font-bold">{name}</h3>
      <div className="mt-4">
        <span className="text-3xl font-bold">{price}</span>
        {price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      
      <ul className="mt-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckIcon className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-8">
        <Link to={`${link}?plan=${name.toLowerCase()}`}>
          <Button
            className={`w-full ${highlighted ? '' : 'bg-primary/90 hover:bg-primary'}`}
            variant={highlighted ? 'default' : 'outline'}
          >
            {buttonText}
          </Button>
        </Link>
      </div>
    </div>
  );
};

const Pricing = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Choose the plan that fits your needs. All plans include all features.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
        <PricingTier
          name="Free"
          price="$0"
          description="Perfect for individuals just getting started."
          features={[
            "10 reports per month",
            "Basic image analysis",
            "Standard templates",
            "Email support"
          ]}
        />
        
        <PricingTier
          name="Pro"
          price="$49"
          description="Ideal for professionals with regular reporting needs."
          features={[
            "Unlimited reports",
            "Advanced image analysis",
            "Custom templates",
            "Priority support",
            "Collaborative editing"
          ]}
          highlighted={true}
        />
        
        <PricingTier
          name="Enterprise"
          price="Custom"
          description="For organizations with specific requirements."
          features={[
            "Unlimited reports",
            "Enterprise-grade security",
            "Custom integrations",
            "Dedicated account manager",
            "On-premise deployment options",
            "SLA guarantees"
          ]}
          buttonText="Contact Sales"
          link="/contact"
        />
      </div>
      
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Our team is ready to help you find the perfect solution for your reporting needs.
        </p>
        <Button variant="outline">Contact Us</Button>
      </div>
    </div>
  );
};

export default Pricing;
