
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileImage, FileText, File as FileIcon, Music } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface UploadedFilesTableProps {
  files: ProjectFile[];
  loading?: boolean;
}

const UploadedFilesTable = ({ files, loading = false }: UploadedFilesTableProps) => {
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

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UploadedFilesTable;
