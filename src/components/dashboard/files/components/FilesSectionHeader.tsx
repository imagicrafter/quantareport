
import { useEffect, useState } from 'react';
import FileActions from './FileActions';
import { supabase } from '@/integrations/supabase/client';

interface FilesSectionHeaderProps {
  onAddFile: () => void;
  onBulkUpload: () => void;
  projectId: string;
  onAnalyzeImages?: () => void;
  hasUnprocessedFiles: boolean;
}

const FilesSectionHeader = ({ 
  onAddFile, 
  onBulkUpload, 
  projectId,
  onAnalyzeImages,
  hasUnprocessedFiles
}: FilesSectionHeaderProps) => {
  return (
    <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
      <h3 className="text-lg font-medium">Project Files</h3>
      <FileActions 
        onAddFile={onAddFile} 
        onBulkUpload={onBulkUpload} 
        onAnalyzeImages={onAnalyzeImages}
        showAnalyzeButton={hasUnprocessedFiles}
      />
    </div>
  );
};

export default FilesSectionHeader;
