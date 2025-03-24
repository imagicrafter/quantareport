
import { useState } from 'react';
import { Edit, Trash2, FileText, Image, Folder, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { formatFileSize } from '@/utils/fileUtils';

export type FileType = 'image' | 'audio' | 'folder' | 'transcription';

export interface ProjectFile {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  type: FileType;
  project_id: string;
  user_id: string;
  created_at: string;
  position: number;
  size?: number;
}

interface FileItemProps {
  file: ProjectFile;
  index: number;
  onEdit: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  dragHandleProps?: any;
}

const FileItem = ({ file, index, onEdit, onDelete, dragHandleProps }: FileItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'audio':
        return <FileAudio className="h-5 w-5 text-purple-500" />;
      case 'transcription':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'folder':
        return <Folder className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 80) => {
    if (!text) return 'No description';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPreview = () => {
    if (file.type === 'image' && file.file_path) {
      return (
        <div className="mb-2 flex justify-center cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
          <img 
            src={file.file_path} 
            alt={file.name} 
            className="h-20 object-cover rounded-md" 
          />
        </div>
      );
    } else if (file.type === 'audio' && file.file_path && file.file_path !== 'audio') {
      return (
        <div className="mb-2 flex justify-center">
          <div className="flex items-center justify-center h-20 w-full bg-secondary/30 rounded-md">
            <FileAudio className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      );
    }
    return null;
  };

  const handleOpenAudio = () => {
    if (file.type === 'audio' && file.file_path && file.file_path !== 'audio') {
      window.open(file.file_path, '_blank');
    }
  };

  return (
    <div
      {...dragHandleProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="mb-2 transition-shadow hover:shadow-md">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getFileIcon(file.type)}
              <CardTitle className="text-sm">{file.name}</CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs flex justify-between">
            <span>{file.type === 'transcription' ? 'Transcription' : file.type.charAt(0).toUpperCase() + file.type.slice(1)} • {formatDate(file.created_at)}</span>
            {file.size && <span>{formatFileSize(file.size)}</span>}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="py-0 px-3">
          {renderPreview()}
          {file.description && (
            <p className="text-xs text-muted-foreground">
              {truncateDescription(file.description)}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-1 py-2 px-3">
          {file.type === 'audio' && file.file_path && file.file_path !== 'audio' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleOpenAudio}
              className="h-7 px-2 text-xs"
            >
              Play Audio
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(file)}
            className="h-7 px-2 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(file)}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto flex items-center justify-center p-1 sm:p-2">
          <img 
            src={file.file_path} 
            alt={file.name} 
            className="max-w-full max-h-[80vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileItem;
