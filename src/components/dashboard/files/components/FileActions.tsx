
import { PlusCircle, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileActionsProps {
  onAddFile: () => void;
  onBulkUpload: () => void;
  onAnalyzeImages?: () => void;
  showAnalyzeButton?: boolean;
}

const FileActions = ({ 
  onAddFile, 
  onBulkUpload, 
  onAnalyzeImages,
  showAnalyzeButton = false
}: FileActionsProps) => {
  return (
    <div className="flex space-x-2">
      {showAnalyzeButton && onAnalyzeImages && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={onAnalyzeImages}
        >
          <Sparkles size={16} className="mr-2" />
          Analyze
        </Button>
      )}
      <Button 
        size="sm" 
        variant="outline"
        onClick={onBulkUpload}
      >
        <Upload size={16} className="mr-2" />
        Bulk Upload
      </Button>
      <Button 
        size="sm" 
        onClick={onAddFile}
      >
        <PlusCircle size={16} className="mr-2" />
        Add File
      </Button>
    </div>
  );
};

export default FileActions;
