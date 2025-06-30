
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui-elements/Button';

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[800px] rounded-full bg-quanta-blue/5"></div>
        <div className="absolute left-1/4 bottom-0 w-[300px] h-[300px] rounded-full bg-quanta-teal/5"></div>
        <div className="absolute right-1/4 top-1/3 w-[500px] h-[500px] rounded-full bg-quanta-blue/5"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-quanta-blue/10 border border-quanta-blue/20 text-quanta-blue text-sm font-medium animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-quanta-blue mr-2"></span>
            Introducing QuantaReport
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            Create Professional Looking Reports in Minutes, Not Hours
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
            QuantaReport empowers professionals to transform images and notes into comprehensive reports with minimal effort. Upload, analyze, report. It's that simple.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link to="/signup">
              <Button size="lg" variant="primary" icon={<ArrowRight size={18} />} iconPosition="right" className="bg-quanta-orange hover:bg-quanta-orange/90 text-white">
                Start Creating Reports Today
              </Button>
            </Link>
            <a href="https://www.youtube.com/watch?v=vWxMM9BZO-k" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                See a live demo
              </Button>
            </a>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto rounded-lg overflow-hidden shadow-glass-lg border border-white/20 animate-scale-in" style={{ animationDelay: '400ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-quanta-blue/5 to-quanta-teal/5"></div>
            <div className="w-full aspect-[16/9] bg-background rounded-lg overflow-hidden">
              <div className="w-full h-full bg-white/80 backdrop-blur-sm rounded-lg p-4">
                <img 
                  src="https://vtaufnxworztolfdwlll.supabase.co/storage/v1/object/public/pub_images//start_new_report.png" 
                  alt="QuantaReport Application Interface" 
                  className="w-full h-full object-cover rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
