
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusIcon, UploadIcon } from 'lucide-react';
import FilesList from './files/FilesList';
import AddFileDialog from './files/AddFileDialog';
import BulkUploadDialog from './files/BulkUploadDialog';
import { FileFormValues, addFile, bulkUploadFiles, loadFilesFromDriveLink } from './files/FileService';
import { toast } from 'sonner';

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
  const [uploading, setUploading] = useState(false);

  const handleAddFile = async (values: FileFormValues) => {
    try {
      setUploading(true);
      await addFile(values, projectId);
      toast.success('File added successfully!');
      setIsAddFileDialogOpen(false);
    } catch (error) {
      console.error('Error adding file:', error);
      toast.error('Failed to add file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (files: File[]) => {
    try {
      setUploading(true);
      const count = await bulkUploadFiles(files, projectId);
      if (count > 0) {
        toast.success(`Successfully uploaded ${count} files`);
      } else {
        toast.info('No files were uploaded');
      }
      setIsBulkUploadDialogOpen(false);
    } catch (error) {
      console.error('Error bulk uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDriveUpload = async (driveLink: string) => {
    try {
      setUploading(true);
      const count = await loadFilesFromDriveLink(driveLink, projectId);
      if (count > 0) {
        toast.success(`Successfully loaded ${count} files from Google Drive`);
      } else {
        toast.info('No files were loaded');
      }
      setIsBulkUploadDialogOpen(false);
    } catch (error) {
      console.error('Error loading files from Google Drive:', error);
      toast.error('Failed to load files from Google Drive. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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
        onAddFile={handleAddFile}
        uploading={uploading}
      />

      <BulkUploadDialog 
        isOpen={isBulkUploadDialogOpen} 
        onClose={() => setIsBulkUploadDialogOpen(false)}
        projectId={projectId}
        onUploadFiles={handleBulkUpload}
        onUploadFromLink={handleDriveUpload}
        uploading={uploading}
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
