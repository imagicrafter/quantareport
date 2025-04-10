
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle } from 'lucide-react';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';

const Step5Generate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const startGeneration = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setIsGenerating(false);
          toast({
            title: "Report generated",
            description: "Your report has been successfully generated."
          });
          return 100;
        }
        return prev + 5;
      });
    }, 300);
  };
  
  // Start generation automatically when component mounts
  useEffect(() => {
    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/notes');
  };
  
  const handleNext = () => {
    navigate('/dashboard/report-wizard/review');
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={5} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center py-6">
              {isGenerating ? (
                <FileText className="h-16 w-16 text-primary mb-4 animate-pulse" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              )}
              
              <h3 className="text-lg font-medium mb-4">
                {isGenerating ? 'Generating Report' : 'Report Generated'}
              </h3>
              
              <div className="w-full max-w-md mb-6">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {isGenerating 
                    ? `Creating your report... ${progress}%` 
                    : 'Your report is ready to review!'
                  }
                </p>
              </div>
              
              {isComplete && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Report Details:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>12 pages total</li>
                      <li>4 sections with findings</li>
                      <li>8 images included</li>
                      <li>Generated on April 10, 2025</li>
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleNext}
                  >
                    Preview Report
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack} disabled={isGenerating}>
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!isComplete}
        >
          Next: Review Report
        </Button>
      </div>
    </div>
  );
};

export default Step5Generate;
