
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface ReportGenerationProgressProps {
  progress: number;
  message: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
}

const ReportGenerationProgress = ({ 
  progress, 
  message, 
  status 
}: ReportGenerationProgressProps) => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium flex items-center">
          {status === 'generating' && (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-500" />
              <span>Analyzing...</span>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Report generated successfully!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              <span>Error generating report</span>
            </div>
          )}
        </span>
        <span className="text-sm font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default ReportGenerationProgress;
