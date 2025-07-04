
import { Link } from 'react-router-dom';
import ContactFormModal from '../contact/ContactFormModal';
import Button from '../ui-elements/Button';

const CTASection = () => {
  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
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
