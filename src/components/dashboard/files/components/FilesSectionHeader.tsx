
import { Button } from '@/components/ui/button';
import { Plus, Upload, Sparkles } from 'lucide-react';

interface FilesSectionHeaderProps {
  onAddFile: () => void;
  onBulkUpload: () => void;
  projectId: string;
  onAnalyzeFiles: () => void;
  hasUnprocessedFiles: boolean;
}

const FilesSectionHeader = ({ 
  onAddFile, 
  onBulkUpload, 
  projectId,
  onAnalyzeFiles,
  hasUnprocessedFiles
}: FilesSectionHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4 p-4 border-b">
      <h2 className="text-lg font-semibold">Files</h2>
      <div className="flex space-x-2">
        {hasUnprocessedFiles && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAnalyzeFiles}
            className="flex items-center"
          >
            <Sparkles size={16} className="mr-2" />
            Analyze Files
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBulkUpload}
          className="flex items-center"
        >
          <Upload size={16} className="mr-2" />
          Bulk Upload
        </Button>
        <Button 
          size="sm"
          onClick={onAddFile}
          className="flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add File
        </Button>
      </div>
    </div>
  );
};

export default FilesSectionHeader;
