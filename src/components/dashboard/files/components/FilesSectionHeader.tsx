
import FileActions from './FileActions';

interface FilesSectionHeaderProps {
  onAddFile: () => void;
  onBulkUpload: () => void;
}

const FilesSectionHeader = ({ onAddFile, onBulkUpload }: FilesSectionHeaderProps) => {
  return (
    <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
      <h3 className="text-lg font-medium">Project Files</h3>
      <FileActions onAddFile={onAddFile} onBulkUpload={onBulkUpload} />
    </div>
  );
};

export default FilesSectionHeader;
