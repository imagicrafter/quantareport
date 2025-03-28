
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusIcon, UploadIcon } from 'lucide-react';
import FilesList from './files/FilesList';
import AddFileDialog from './files/AddFileDialog';
import BulkUploadDialog from './files/BulkUploadDialog';

// Main component for backward compatibility
const FilesSection = ({ projectId }: { projectId: string }) => {
  return (
    <>
      <Header projectId={projectId} />
      <Content projectId={projectId} />
    </>
  );
};

// Header component with title and action buttons
const Header = ({ projectId }: { projectId: string }) => {
  const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold">Project Files</h2>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsBulkUploadDialogOpen(true)}
            variant="outline" 
            size="sm"
            className="gap-1"
          >
            <UploadIcon className="h-4 w-4" />
            Bulk Upload
          </Button>
          
          <Button 
            onClick={() => setIsAddFileDialogOpen(true)}
            variant="outline" 
            size="sm"
            className="gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Add File
          </Button>
        </div>
      </div>

      {/* File Dialogs */}
      <AddFileDialog 
        isOpen={isAddFileDialogOpen} 
        onClose={() => setIsAddFileDialogOpen(false)}
        projectId={projectId}
      />

      <BulkUploadDialog 
        isOpen={isBulkUploadDialogOpen} 
        onClose={() => setIsBulkUploadDialogOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};

// Content component with the files list
const Content = ({ projectId }: { projectId: string }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const refreshFiles = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <FilesList 
      projectId={projectId}
      refreshTrigger={refreshTrigger}
      onFileChange={refreshFiles}
    />
  );
};

// Add these to FilesSection for export
FilesSection.Header = Header;
FilesSection.Content = Content;

export default FilesSection;
