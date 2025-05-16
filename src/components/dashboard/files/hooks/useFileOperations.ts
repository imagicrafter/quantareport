
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { DropResult } from 'react-beautiful-dnd';
import { reorderFiles } from '@/utils/fileUtils';
import { ProjectFile, FileType } from '../FileItem';
import { 
  addFile, 
  updateFile, 
  deleteFile, 
  FileFormValues, 
  bulkUploadFiles,
  loadFilesFromDriveLink 
} from '../FileService';

export const useFileOperations = (projectId: string, loadFiles: () => Promise<void>) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const handleAddFile = async (values: any) => {
    try {
      setUploading(true);
      const fileFormValues: FileFormValues = {
        name: values.title,
        description: values.description,
        file: values.file?.[0],
        type: values.type as FileType
      };
      
      await addFile(fileFormValues, projectId);
      
      toast({
        title: 'Success',
        description: 'File added successfully!',
      });

      setIsAddDialogOpen(false);
      loadFiles();
    } catch (error) {
      console.error('Error adding file:', error);
      toast({
        title: 'Error',
        description: 'Failed to add file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditFile = async (values: any) => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const fileFormValues: FileFormValues = {
        name: values.title,
        description: values.description,
        file: values.file?.[0],
        type: values.type as FileType
      };
      
      await updateFile(selectedFile.id, fileFormValues);

      toast({
        title: 'Success',
        description: 'File updated successfully!',
      });

      setIsEditDialogOpen(false);
      loadFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      toast({
        title: 'Error',
        description: 'Failed to update file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await deleteFile(selectedFile);

      toast({
        title: 'Success',
        description: 'File deleted successfully!',
      });

      setIsDeleteDialogOpen(false);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReorderFiles = async (result: DropResult, files: ProjectFile[]) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    try {
      const reorderedFiles = await reorderFiles(files, sourceIndex, destinationIndex);
      return reorderedFiles;
    } catch (error) {
      console.error('Error reordering files:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder files. Please try again.',
        variant: 'destructive',
      });
      loadFiles();
    }
  };

  const handleBulkUploadFiles = async (files: File[]) => {
    try {
      setUploading(true);
      const successCount = await bulkUploadFiles(files, projectId);
      
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} ${successCount === 1 ? 'file' : 'files'} uploaded successfully!`,
        });
        
        setIsBulkUploadDialogOpen(false);
        loadFiles();
      } else {
        toast({
          title: 'No files uploaded',
          description: 'No files were successfully uploaded. Please check file types and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error with bulk upload:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFromDriveLink = async (link: string) => {
    try {
      setUploading(true);
      const successCount = await loadFilesFromDriveLink(link, projectId);
      
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} ${successCount === 1 ? 'file' : 'files'} loaded from Google Drive!`,
        });
        
        setIsBulkUploadDialogOpen(false);
        loadFiles();
      } else {
        toast({
          title: 'Google Drive Integration',
          description: 'This feature requires backend integration with Google Drive API. Please implement this in the backend.',
        });
      }
    } catch (error) {
      console.error('Error loading from Google Drive:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files from Google Drive. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return {
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
  };
};
