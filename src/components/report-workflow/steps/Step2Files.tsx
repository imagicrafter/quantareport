
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Image } from 'lucide-react';

const Step2Files = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    // Simulate file upload
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${files.length} files.`
      });
      // In a real implementation, we would save the files to storage
      navigate('/dashboard/report-wizard/process');
    }, 2000);
  };
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/start');
  };
  
  const handleSkip = () => {
    toast({
      description: "Skipping file upload step."
    });
    navigate('/dashboard/report-wizard/process');
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={2} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Files</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Upload images, documents, or any other files that will be used in your report.
                Supported formats: JPG, PNG, PDF, DOC, DOCX
              </p>
              
              <label className="cursor-pointer">
                <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
                  Select Files
                </div>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Selected Files ({files.length})</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center p-2 bg-muted rounded">
                      {file.type.includes('image') ? (
                        <Image className="h-5 w-5 mr-2 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 mr-2 text-green-500" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <div className="space-x-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? (
              <>
                <span className="mr-2">Uploading</span>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'Next: Process Files'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step2Files;
