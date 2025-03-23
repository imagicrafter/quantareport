
import { useState } from 'react';

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    {
      title: "Select Template",
      description: "Choose from our library of industry-specific templates for your project or we can customize one to match your exact needs.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      )
    },
    {
      title: "Upload Images & Notes",
      description: "Upload your images and notes to the platform. Upload files directly and instantly record and transcribe descriptions.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      )
    },
    {
      title: "AI Report Generation",
      description: "Our AI system analyzes your images and notes, extracting key information for your report that combines your images, notes using your project's selected template.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M16 21v-2"/><path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/></svg>
      )
    },
    {
      title: "Review & Edit",
      description: "Review your report and make any necessary edits through our intuitive chat-based interface.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      )
    },
    {
      title: "Export & Share",
      description: "Download your finalized report in your preferred format or share it directly with your team or clients.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
      )
    }
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From upload to delivery, our streamlined process makes report creation simple and efficient.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`p-6 rounded-lg border transition-all duration-300 cursor-pointer ${
                  activeStep === index 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activeStep === index ? 'bg-primary/10' : 'bg-secondary'
                  }`}>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative h-[500px] bg-secondary/50 rounded-lg overflow-hidden border border-border">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {steps[activeStep].icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{steps[activeStep].title}</h3>
                <p className="text-muted-foreground max-w-sm">Step {activeStep + 1} visualization will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
