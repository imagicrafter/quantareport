
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createProspect } from '@/services/prospectService';
import { toast } from 'sonner';

const interestAreas = [
  'Construction Reports',
  'Insurance Documentation', 
  'Property Inspections',
  'Engineering Reports',
  'Environmental Assessments',
  'Other'
];

const ProspectCaptureForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    interest_area: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);
    
    const result = await createProspect({
      email: formData.email,
      name: formData.name || undefined,
      company: formData.company || undefined,
      interest_area: formData.interest_area || undefined,
      source: 'landing_page'
    });

    if (result.success) {
      setIsSubmitted(true);
      toast.success('Thank you for your interest! We\'ll be in touch soon.');
    } else {
      toast.error(result.error || 'Failed to submit your information');
    }
    
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Thank You!</CardTitle>
          <CardDescription>
            We've received your information and will be in touch soon with updates about QuantaReport.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Get Early Access</CardTitle>
        <CardDescription>
          Join our alpha program and be among the first to experience the future of professional report creation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              type="text"
              placeholder="Your company name"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interest">Primary Interest</Label>
            <Select value={formData.interest_area} onValueChange={(value) => setFormData(prev => ({ ...prev, interest_area: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your primary interest" />
              </SelectTrigger>
              <SelectContent>
                {interestAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Join Alpha Program'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProspectCaptureForm;
