import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui-elements/Button';
import ContactFormModal from '../contact/ContactFormModal';

const PricingSection = () => {
  const plans = [
    {
      name: "Free Demo",
      description: "Perfect for trying out the platform",
      price: "0",
      features: [
        "5 reports",
        "20 images per report",
        "Basic templates only",
        "Standard AI processing",
        "Export as PDF only",
      ],
      limitedFeatures: [
        "No custom templates",
      ],
      popular: false,
    },
    {
      name: "Starter",
      description: "For individuals and small teams",
      price: "7.99",
      features: [
        "Basic templates only",
        "Advanced AI processing",
        "Email support",
      ],
      limitedFeatures: [],
      popular: true,
    },
    {
      name: "Professional",
      description: "For organizations with advanced needs",
      price: "11.99",
      features: [
        "Advanced templates",
        "Priority AI processing",
        "Export in multiple formats",
        "Dedicated support",
      ],
      limitedFeatures: [],
      popular: false,
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/30" id="pricing">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for your reporting needs. No hidden fees or surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                plan.popular 
                  ? 'border-2 border-primary shadow-lg' 
                  : 'border border-border glass-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-end">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground ml-1 mb-1">/report</span>
                  </div>
                </div>
                
                <ContactFormModal>
                  <Button 
                    variant={plan.popular ? "primary" : "outline"} 
                    className="w-full mb-6"
                  >
                    Contact Us
                  </Button>
                </ContactFormModal>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">Includes:</p>
                  
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitedFeatures.length > 0 && (
                    <>
                      <div className="pt-2"></div>
                      {plan.limitedFeatures.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 shrink-0"><line x1="5" x2="19" y1="12" y2="12"/></svg>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 border border-border rounded-lg bg-white/70 backdrop-blur-sm shadow-sm max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 9V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9L12 8.5"/><path d="M2 13v6a2 2 0 0 0 2 2h6"/><path d="m22 12-7.22 7.22a2 2 0 0 1-1.56.6h-3.4a2 2 0 0 1-2-2.3l.5-3.48a2 2 0 0 1 .54-1.2L15 7"/></svg>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-medium mb-2">Need a custom solution?</h3>
              <p className="text-muted-foreground mb-4">Contact our sales team for a customized plan tailored to your specific requirements.</p>
              <Link to="/contact-sales">
                <Button variant="outline">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
