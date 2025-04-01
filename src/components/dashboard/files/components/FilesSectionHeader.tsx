
import { Button } from '@/components/ui/button';
import { Plus, Upload, Sparkles } from 'lucide-react';

interface FilesSectionHeaderProps {
  onAddFile: () => void;
  onBulkUpload: () => void;
  projectId: string;
  onAnalyzeFiles: () => void;
  hasUnprocessedFiles: boolean;
  isAnalyzing: boolean;
}

const FilesSectionHeader = ({ 
  onAddFile, 
  onBulkUpload, 
  projectId,
  onAnalyzeFiles,
  hasUnprocessedFiles,
  isAnalyzing
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
            disabled={isAnalyzing}
            className="flex items-center"
          >
            {isAnalyzing ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Analyze Files
              </>
            )}
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
