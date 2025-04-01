
import { useState } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import Button from '../../../ui-elements/Button';

interface FileActionsProps {
  onAddFile: () => void;
  onBulkUpload: () => void;
}

const FileActions = ({ onAddFile, onBulkUpload }: FileActionsProps) => {
  return (
    <div className="flex space-x-2">
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
