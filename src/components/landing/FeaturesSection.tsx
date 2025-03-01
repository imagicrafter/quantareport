
import { CheckCircle2 } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      title: "Industry-specific templates",
      description: "Pre-built report templates for engineering, insurance, construction, appraisals, and more.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="8" height="14" x="8" y="5" rx="1"/><path d="M4 5h16"/><path d="M4 19h16"/></svg>
      )
    },
    {
      title: "AI-powered image analysis",
      description: "Our smart system analyzes and describes images, extracting key details for your reports.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="9" cy="9" r="2"/><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10.8"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19.5 3 3v-6"/><path d="m17 16.5 3 3"/></svg>
      )
    },
    {
      title: "Notes processing & compilation",
      description: "Convert text, documents, and audio files into organized notes for your reports.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
      )
    },
    {
      title: "Seamless integrations",
      description: "Connect with Google Drive, Supabase, and Stripe for a complete business workflow.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/></svg>
      )
    },
    {
      title: "Real-time feedback & editing",
      description: "Chat-based interface for reviewing and improving your reports in real-time.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      )
    },
    {
      title: "Multiple export options",
      description: "Download your finalized reports in PDF, Word, or share them directly via email.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      )
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful features to transform your workflow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Our comprehensive platform streamlines the entire reporting process from image upload to final delivery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="glass-card p-6 hover:translate-y-[-4px]"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Engineering",
                items: ["Structural reports", "Site assessments", "Technical specifications"]
              },
              {
                title: "Insurance",
                items: ["Damage assessments", "Claim documentation", "Risk evaluations"]
              },
              {
                title: "Construction",
                items: ["Project progress", "Site inspections", "Safety compliance"]
              }
            ].map((domain, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-lg font-medium">{domain.title}</h3>
                <ul className="space-y-2">
                  {domain.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
