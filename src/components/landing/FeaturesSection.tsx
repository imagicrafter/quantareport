import { Image, PencilLine, ArrowRight } from 'lucide-react';

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
      title: "Centralized data storage",
      description: "Keep all your reports, images, and notes in one secure location.",
      icon: <Image className="h-12 w-12 text-primary" />,
    },
  ];

  return (
    <section className="py-20 bg-secondary/10" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore the features that make our reporting platform the best solution for your needs.
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
