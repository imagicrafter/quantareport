
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileImage, FileText, File as FileIcon, Music, Trash2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useState } from 'react';
import DeleteFileDialog from '@/components/dashboard/files/DeleteFileDialog';
import { deleteFile } from '@/components/dashboard/files/services/DeleteFileService';
import { useToast } from '@/components/ui/use-toast';

interface UploadedFilesTableProps {
  files: ProjectFile[];
  loading?: boolean;
  onFileDeleted?: () => void;
}

const UploadedFilesTable = ({ files, loading = false, onFileDeleted }: UploadedFilesTableProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files uploaded yet
      </div>
    );
  }

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-4 w-4 text-blue-500" />;
      case 'text':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'audio':
        return <Music className="h-4 w-4 text-purple-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleDeleteClick = (file: ProjectFile) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteFile(fileToDelete);
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{getFileIcon(file.type)}</TableCell>
                <TableCell className="font-medium">{file.name}</TableCell>
                <TableCell className="capitalize">{file.type}</TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>{formatDate(file.created_at)}</TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleDeleteClick(file)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    aria-label="Delete file"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteFileDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteConfirm}
        uploading={isDeleting}
      />
    </>
  );
};

export default UploadedFilesTable;
