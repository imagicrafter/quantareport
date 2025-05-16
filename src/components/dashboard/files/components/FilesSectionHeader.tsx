
import FileActions from './FileActions';

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
      <FileActions 
        key={`file-actions-${hasUnprocessedFiles ? 'unprocessed' : 'processed'}`}
        onAddFile={onAddFile}
        onBulkUpload={onBulkUpload}
        onAnalyzeImages={onAnalyzeFiles}
        showAnalyzeButton={hasUnprocessedFiles}
      />
    </div>
  );
};

export default FilesSectionHeader;
