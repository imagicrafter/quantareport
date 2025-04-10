
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { FileSearch, CheckCircle, AlertCircle } from 'lucide-react';

const Step3Process = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  
  // Simulate file processing
  useEffect(() => {
    setProcessingStatus('processing');
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessingComplete(true);
          setProcessingStatus('complete');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/files');
  };
  
  const handleNext = () => {
    navigate('/dashboard/report-wizard/notes');
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={3} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center py-4">
              {processingStatus === 'processing' && (
                <FileSearch className="h-16 w-16 text-primary mb-4 animate-pulse" />
              )}
              
              {processingStatus === 'complete' && (
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              )}
              
              {processingStatus === 'error' && (
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              )}
              
              <h3 className="text-lg font-medium mb-2">
                {processingStatus === 'processing' && 'Processing Files'}
                {processingStatus === 'complete' && 'Processing Complete'}
                {processingStatus === 'error' && 'Processing Error'}
              </h3>
              
              <div className="w-full max-w-md mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {processingStatus === 'processing' && `Analyzing content... ${progress}%`}
                  {processingStatus === 'complete' && 'All files have been successfully processed'}
                  {processingStatus === 'error' && 'An error occurred during processing'}
                </p>
              </div>
              
              {processingStatus === 'complete' && (
                <div className="bg-muted p-4 rounded-md w-full mt-4">
                  <h4 className="font-medium mb-2">Processing Results:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Extracted text from 3 documents</li>
                    <li>Analyzed 2 images with AI vision</li>
                    <li>Generated key insights from content</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!processingComplete}
        >
          Next: Edit Notes
        </Button>
      </div>
    </div>
  );
};

export default Step3Process;
