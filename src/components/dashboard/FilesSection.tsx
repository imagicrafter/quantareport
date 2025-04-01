
import { useState, useEffect } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { Toaster } from 'sonner';
import FilesSectionHeader from './files/components/FilesSectionHeader';
import FilesContainer from './files/components/FilesContainer';
import AddFileDialog from './files/AddFileDialog';
import EditFileDialog from './files/EditFileDialog';
import DeleteFileDialog from './files/DeleteFileDialog';
import BulkUploadDialog from './files/BulkUploadDialog';
import { useFiles } from './files/hooks/useFiles';
import { useFileOperations } from './files/hooks/useFileOperations';
import { useImageAnalysis } from './files/hooks/useImageAnalysis';
import { supabase } from '@/integrations/supabase/client';

interface FilesSectionProps {
  projectId: string;
  projectName?: string;
}

const FilesSection = ({ projectId, projectName = '' }: FilesSectionProps) => {
  const { files, setFiles, loading, loadFiles } = useFiles(projectId);
  const {
    uploading,
    selectedFile,
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    isBulkUploadDialogOpen,
    setSelectedFile,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setIsBulkUploadDialogOpen,
    handleAddFile,
    handleEditFile,
    handleDeleteFile,
    handleReorderFiles,
    handleBulkUploadFiles,
    handleUploadFromDriveLink,
  } = useFileOperations(projectId, loadFiles);

  const {
    isAnalyzing,
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles
  } = useImageAnalysis(projectId, projectName);

  // Check for unprocessed files when the component mounts or files are updated
  useEffect(() => {
    if (projectId) {
      checkUnprocessedFiles();
    }
  }, [projectId, checkUnprocessedFiles, files]);

  // Get project name if not provided
  const [fetchedProjectName, setFetchedProjectName] = useState('');
  
  useEffect(() => {
    if (projectId && !projectName) {
      const fetchProjectName = async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();
          
        if (!error && data) {
          setFetchedProjectName(data.name);
        }
      };
      
      fetchProjectName();
    }
  }, [projectId, projectName]);

  const effectiveProjectName = projectName || fetchedProjectName;

  const onReorderFiles = async (result: DropResult) => {
    const reorderedFiles = await handleReorderFiles(result, files);
    if (reorderedFiles) {
      setFiles(reorderedFiles);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add Sonner Toaster component for better toast notifications */}
      <Toaster position="top-right" closeButton richColors />
      
      <FilesSectionHeader 
        onAddFile={() => setIsAddDialogOpen(true)}
        onBulkUpload={() => setIsBulkUploadDialogOpen(true)}
        projectId={projectId}
        onAnalyzeFiles={analyzeFiles}
        hasUnprocessedFiles={hasUnprocessedFiles}
        isAnalyzing={isAnalyzing}
      />

      <FilesContainer 
        files={files}
        loading={loading}
        onEditFile={(file) => {
          setSelectedFile(file);
          setIsEditDialogOpen(true);
        }}
        onDeleteFile={(file) => {
          setSelectedFile(file);
          setIsDeleteDialogOpen(true);
        }}
        onReorderFiles={onReorderFiles}
      />

      <AddFileDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFile={handleAddFile}
        uploading={uploading}
        projectId={projectId}
      />

      <EditFileDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onEditFile={handleEditFile}
        selectedFile={selectedFile}
        uploading={uploading}
      />

      <DeleteFileDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteFile}
        uploading={uploading}
      />

      <BulkUploadDialog
        isOpen={isBulkUploadDialogOpen}
        onClose={() => setIsBulkUploadDialogOpen(false)}
        onUploadFiles={handleBulkUploadFiles}
        onUploadFromLink={handleUploadFromDriveLink}
        uploading={uploading}
        projectId={projectId}
      />
    </div>
  );
};

export default FilesSection;
