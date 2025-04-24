
import { Image, PencilLine, ArrowRight, FileText, BrainCircuit, ClipboardList } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      title: "Image annotations",
      description: "Add annotations to your images to highlight important areas of interest.",
      icon: <PencilLine className="h-12 w-12 text-primary" />,
    },
    {
      title: "Fast and simple report creation",
      description: "Within minutes of uploading your images and notes, have a professional looking report ready to review.",
      icon: <ArrowRight className="h-12 w-12 text-primary" />,
    },
    {
      title: "Industry-specific templates",
      description: "Pre-built report templates for engineering, insurance, construction, appraisals, and more.",
      icon: <FileText className="h-12 w-12 text-primary" />,
    },
    {
      title: "AI-powered image analysis",
      description: "Our smart system analyzes and describes images, extracting key details for your reports.",
      icon: <BrainCircuit className="h-12 w-12 text-primary" />,
    },
    {
      title: "Notes processing & compilation",
      description: "Convert text, documents, and audio files into organized notes for your reports.",
      icon: <ClipboardList className="h-12 w-12 text-primary" />,
    },
  ];

  return (
    <section className="py-20 bg-secondary/10" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful features to transform your workflow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform streamlines the entire reporting process from image upload to final delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glass-card p-6 rounded-lg">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
