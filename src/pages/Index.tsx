
import { useEffect } from 'react';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import ProspectCaptureForm from '../components/landing/ProspectCaptureForm';
// import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        
        {/* Prospect Capture Section */}
        <section id="early-access" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Report Creation?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join our alpha program and be among the first to experience the future of professional report creation.
              </p>
            </div>
            <ProspectCaptureForm />
          </div>
        </section>
        
        {/* <PricingSection /> */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
