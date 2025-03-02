
import { Link } from 'react-router-dom';
import Button from '../ui-elements/Button';

const CTASection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 right-0 h-px bg-white/20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-black/20"></div>
            <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-white/10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-white/10"></div>
          </div>
          
          <div className="relative px-6 py-20 md:py-28 md:px-12 text-center">
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
              Transform your workflow today
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 max-w-2xl mx-auto">
              Ready to streamline your report creation process?
            </h2>
            
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of professionals who save time and deliver better reports with Inovy.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Get started for free
                </Button>
              </Link>
              <Link to="/demo">
                <Button 
                  size="lg" 
                  className="bg-transparent border border-white/30 text-white hover:bg-white/10"
                >
                  See a live demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
