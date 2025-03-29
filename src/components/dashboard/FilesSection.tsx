
import { useState, useEffect } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { PlusCircle, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Button from '../ui-elements/Button';
import FilesList from './files/FilesList';
import AddFileDialog from './files/AddFileDialog';
import EditFileDialog from './files/EditFileDialog';
import DeleteFileDialog from './files/DeleteFileDialog';
import BulkUploadDialog from './files/BulkUploadDialog';
import { ProjectFile, FileType } from './files/FileItem';
import { 
  fetchFiles, 
  addFile, 
  updateFile, 
  deleteFile, 
  FileFormValues,
  bulkUploadFiles,
  loadFilesFromDriveLink
} from './files/FileService';
import { reorderFiles } from '@/utils/fileUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilesSectionProps {
  projectId: string;
}

const FilesSection = ({ projectId }: FilesSectionProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchFiles(projectId);
      const sortedFiles = [...data].sort((a, b) => (a.position || 0) - (b.position || 0));
      setFiles(sortedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  const handleAddFile = async (values: any) => {
    try {
      setUploading(true);
      const fileFormValues: FileFormValues = {
        name: values.title,
        description: values.description,
        file: values.file?.[0], // Access the first file from FileList
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
        file: values.file?.[0], // Access the first file from FileList
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

  const handleReorderFiles = async (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    try {
      const reorderedFiles = await reorderFiles(files, sourceIndex, destinationIndex);
      setFiles(reorderedFiles);
      
      toast({
        title: 'Success',
        description: 'File order updated successfully!',
      });
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
        <h3 className="text-lg font-medium">Project Files</h3>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsBulkUploadDialogOpen(true)}
          >
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle size={16} className="mr-2" />
            Add File
          </Button>
        </div>
      </div>

      <div className="flex-grow mt-4 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <FilesList 
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
            onReorderFiles={handleReorderFiles}
          />
        </ScrollArea>
      </div>

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
