
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui-elements/Button';

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[800px] rounded-full bg-primary/5"></div>
        <div className="absolute left-1/4 bottom-0 w-[300px] h-[300px] rounded-full bg-primary/5"></div>
        <div className="absolute right-1/4 top-1/3 w-[500px] h-[500px] rounded-full bg-primary/5"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            Introducing Inovy
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            Transform your images and notes into professional reports with AI
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
            Streamline your workflow with our intelligent platform that automatically processes images, organizes notes, and generates comprehensive reports.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link to="/signup">
              <Button size="lg" variant="primary" icon={<ArrowRight size={18} />} iconPosition="right">
                Get started for free
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline">
                See a live demo
              </Button>
            </Link>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto rounded-lg overflow-hidden shadow-glass-lg border border-white/20 animate-scale-in" style={{ animationDelay: '400ms' }}>
            <div className="absolute inset-0 bg-primary/5"></div>
            <div className="w-full aspect-[16/9] bg-background rounded-lg overflow-hidden">
              <div className="w-full h-full bg-white/80 backdrop-blur-sm rounded-lg p-4">
                <div className="w-full h-full rounded bg-white shadow-sm flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                    </div>
                    <h3 className="text-xl font-medium mb-2">Application Interface Preview</h3>
                    <p className="text-muted-foreground">The dashboard interface will appear here once built.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
