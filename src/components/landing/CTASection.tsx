
import { Link } from 'react-router-dom';
import ContactFormModal from '../contact/ContactFormModal';
import Button from '../ui-elements/Button';

const CTASection = () => {
  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to streamline your report creation process?
        </h2>
        {/* <p className="text-xl text-muted-foreground mb-8">
          Join thousands of professionals who save time and deliver better reports with QuantaReport
        </p> */}
        {/* Contact button commented out as requested
        <ContactFormModal>
          <Button variant="primary" size="lg">
            Contact Us Today
          </Button>
        </ContactFormModal>
        */}
      </div>
    </section>
  );
};

export default CTASection;
