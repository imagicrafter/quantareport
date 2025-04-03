
import { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import FilesSectionHeader from './files/components/FilesSectionHeader';
import FilesContainer from './files/components/FilesContainer';
import AddFileDialog from './files/AddFileDialog';
import EditFileDialog from './files/EditFileDialog';
import DeleteFileDialog from './files/DeleteFileDialog';
import BulkUploadDialog from './files/BulkUploadDialog';
import { useFiles } from './files/hooks/useFiles';
import { useFileOperations } from './files/hooks/useFileOperations';

interface FilesSectionProps {
  projectId: string;
}

const FilesSection = ({ projectId }: FilesSectionProps) => {
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

  const onReorderFiles = async (result: DropResult) => {
    const reorderedFiles = await handleReorderFiles(result, files);
    if (reorderedFiles) {
      setFiles(reorderedFiles);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <FilesSectionHeader 
        onAddFile={() => setIsAddDialogOpen(true)}
        onBulkUpload={() => setIsBulkUploadDialogOpen(true)}
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
