
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, AlertCircle, FileSearch, Clock } from "lucide-react";

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
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Clock className="h-16 w-16 text-muted-foreground mb-4" />;
      case 'generating':
        return <FileSearch className="h-16 w-16 text-primary mb-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-16 w-16 text-green-500 mb-4" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-red-500 mb-4" />;
      default:
        return <Clock className="h-16 w-16 text-muted-foreground mb-4" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'idle':
        return 'Preparing Analysis';
      case 'generating':
        return 'Analyzing Files';
      case 'completed':
        return 'Analysis Complete';
      case 'error':
        return 'Analysis Error';
      default:
        return 'File Analysis';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Preparing...</span>
          </div>
        );
      case 'generating':
        return (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-500" />
            <span>Processing...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            <span>Files analyzed successfully!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            <span>Error analyzing files</span>
          </div>
        );
      default:
        return <span>File analysis</span>;
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col items-center py-4">
        {getStatusIcon()}
        
        <h3 className="text-lg font-medium mb-2">
          {getStatusTitle()}
        </h3>
        
        <div className="w-full max-w-md mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium flex items-center">
              {getStatusLabel()}
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center mt-2">{message}</p>
        </div>
        
        {fileCount > 0 && status === 'generating' && (
          <p className="text-sm text-muted-foreground">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} queued for analysis
          </p>
        )}
        
        {status === 'completed' && (
          <p className="text-sm text-green-600 font-medium">
            Proceeding to next step automatically...
          </p>
        )}
      </div>
    </div>
  );
};

export default FileAnalysisProgress;
