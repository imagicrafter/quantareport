
import React from 'react';
import { File, FileImage, FileAudio, Edit, Trash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Button from '../../ui-elements/Button';
import { formatFileSize } from '@/utils/fileUtils';

export type FileType = 'image' | 'audio' | 'other';

export interface ProjectFile {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  type: FileType;
  position: number;
  created_at: string;
  size?: number;
}

interface FileItemProps {
  file: ProjectFile;
  onEdit: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  dragHandleProps?: any;
}

const FileItem: React.FC<FileItemProps> = ({ 
  file, 
  onEdit, 
  onDelete,
  dragHandleProps
}) => {
  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'image':
        return <FileImage size={16} />;
      case 'audio':
        return <FileAudio size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const renderFilePreview = () => {
    if (file.type === 'image' && file.file_path !== 'audio') {
      return (
        <div className="relative w-12 h-12 mr-4 overflow-hidden rounded bg-gray-100">
          <img
            src={file.file_path}
            alt={file.name}
            className="object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center w-12 h-12 mr-4 bg-gray-100 rounded">
        {getFileIcon(file.type)}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card className="flex items-center p-3 mb-2">
      <div className="flex items-center flex-1">
        <div {...dragHandleProps} className="mr-2 cursor-grab">
          {/* Drag handle icon will be added by Draggable */}
        </div>
        
        {renderFilePreview()}
        
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{file.name}</p>
          <div className="flex text-xs text-muted-foreground">
            <span className="mr-2">{file.type}</span>
            <span className="mr-2">•</span>
            <span>{formatDate(file.created_at)}</span>
            {file.size !== undefined && (
              <>
                <span className="mr-2">•</span>
                <span>{formatFileSize(file.size)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-1">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onEdit(file)}
        >
          <Edit size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete(file)}
        >
          <Trash size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default FileItem;
