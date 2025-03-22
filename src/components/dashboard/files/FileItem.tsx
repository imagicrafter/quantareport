
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

  const truncateDescription = (text: string | null, maxLength: number = 100) => {
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

  const handleOpenFile = () => {
    if (file.type === 'folder') {
      window.open(file.file_path, '_blank');
    } else if (file.type === 'image' || file.type === 'audio') {
      window.open(file.file_path, '_blank');
    }
    // Transcription files don't have a file to open
  };

  return (
    <div
      {...dragHandleProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="mb-3 transition-shadow hover:shadow-md">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getFileIcon(file.type)}
              <CardTitle className="text-base">{file.name}</CardTitle>
            </div>
            {file.type !== 'transcription' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFile}
                className={isHovered ? 'opacity-100' : 'opacity-0'}
              >
                Open
              </Button>
            )}
          </div>
          <CardDescription>
            {file.type === 'transcription' ? 'Transcription' : file.type.charAt(0).toUpperCase() + file.type.slice(1)} • Added {formatDate(file.created_at)}
          </CardDescription>
        </CardHeader>
        {file.description && (
          <CardContent className="py-0">
            <p className="text-sm text-muted-foreground">
              {truncateDescription(file.description)}
            </p>
          </CardContent>
        )}
        <CardFooter className="flex justify-end space-x-2 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(file)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(file)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FileItem;
