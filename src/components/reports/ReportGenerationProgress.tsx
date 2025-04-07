
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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
        <span className="text-sm font-medium">
          {status === 'generating' && (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </div>
          )}
          {status === 'completed' && "Report generated successfully!"}
          {status === 'error' && "Error generating report"}
        </span>
        <span className="text-sm font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default ReportGenerationProgress;
