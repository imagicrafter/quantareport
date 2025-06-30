
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, AlertCircle, FileSearch } from "lucide-react";

interface FileAnalysisProgressProps {
  progress: number;
  message: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  fileCount?: number;
}

const FileAnalysisProgress = ({ 
  progress, 
  message, 
  status,
  fileCount = 0
}: FileAnalysisProgressProps) => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col items-center py-4">
        {status === 'generating' && (
          <FileSearch className="h-16 w-16 text-primary mb-4 animate-pulse" />
        )}
        
        {status === 'completed' && (
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        )}
        
        {status === 'error' && (
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        )}
        
        <h3 className="text-lg font-medium mb-2">
          {status === 'generating' && 'Analyzing Files'}
          {status === 'completed' && 'Analysis Complete'}
          {status === 'error' && 'Analysis Error'}
        </h3>
        
        <div className="w-full max-w-md mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium flex items-center">
              {status === 'generating' && (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-500" />
                  <span>Processing...</span>
                </div>
              )}
              {status === 'completed' && (
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Files analyzed successfully!</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  <span>Error analyzing files</span>
                </div>
              )}
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center mt-2">{message}</p>
        </div>
        
        {fileCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} queued for analysis
          </p>
        )}
      </div>
    </div>
  );
};

export default FileAnalysisProgress;
