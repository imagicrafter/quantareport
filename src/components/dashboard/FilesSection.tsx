
import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Button from '../ui-elements/Button';
import FilesList from './files/FilesList';
import AddFileDialog from './files/AddFileDialog';
import EditFileDialog from './files/EditFileDialog';
import DeleteFileDialog from './files/DeleteFileDialog';
import { ProjectFile } from './files/FileItem';
import { fetchFiles, addFile, updateFile, deleteFile, FileFormValues } from './files/FileService';

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
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchFiles(projectId);
      setFiles(data);
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

  const handleAddFile = async (values: FileFormValues) => {
    try {
      setUploading(true);
      await addFile(values, projectId);
      
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

  const handleEditFile = async (values: FileFormValues) => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await updateFile(selectedFile.id, values);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Files</h3>
        <Button 
          size="sm" 
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusCircle size={16} className="mr-2" />
          Add File
        </Button>
      </div>

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
      />

      <AddFileDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFile={handleAddFile}
        uploading={uploading}
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
    </div>
  );
};

export default FilesSection;
