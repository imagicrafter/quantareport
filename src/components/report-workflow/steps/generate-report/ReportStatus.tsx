
import { CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ReportGenerationProgress from '@/components/reports/ReportGenerationProgress';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface ProgressUpdate {
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
  progress: number;
}

interface ReportStatusProps {
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
  progress: number;
  onGenerateReport: () => void;
  onPreviewReport: () => void;
  onTryAgain: () => void;
  projectId: string | null;
  isGenerating: boolean;
  reportContent?: string | null;
  existingReport?: { id: string, content?: string } | null;
}

const ReportStatus = ({
  status,
  message,
  progress,
  onGenerateReport,
  onPreviewReport,
  onTryAgain,
  projectId,
  isGenerating,
  reportContent,
  existingReport
}: ReportStatusProps) => {
  const content = reportContent || existingReport?.content || '';
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center py-6">
          {status === 'generating' ? (
            <FileText className="h-16 w-16 text-primary mb-4 animate-pulse" />
          ) : status === 'completed' ? (
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          ) : (
            <FileText className="h-16 w-16 text-primary mb-4" />
          )}
          
          <h3 className="text-lg font-medium mb-4">
            {status === 'generating' ? 'Generating Report' : 
             status === 'completed' ? 'Report Generated' : 
             status === 'error' ? 'Error Generating Report' : 'Generate Your Report'}
          </h3>
          
          <div className="w-full max-w-md mb-6">
            <ReportGenerationProgress 
              progress={progress} 
              message={message}
              status={status}
            />
          </div>
          
          {status === 'idle' && (
            <Button 
              className="w-full max-w-md flex items-center justify-center"
              onClick={onGenerateReport}
              disabled={!projectId || isGenerating}
            >
              <Play className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          )}
          
          {status === 'completed' && (
            <div className="space-y-4 w-full max-w-md">
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Report Details:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Report generated successfully</li>
                  <li>Images included: {content.match(/<img/g)?.length || 0}</li>
                  <li>Generated on {new Date().toLocaleDateString()}</li>
                </ul>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={onPreviewReport}
              >
                Preview Report
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4 w-full max-w-md">
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <h4 className="font-medium mb-2">Error Details:</h4>
                <p className="text-sm">{message}</p>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={onTryAgain}
                disabled={!projectId || isGenerating}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportStatus;
