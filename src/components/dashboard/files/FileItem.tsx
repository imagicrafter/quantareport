
import { Edit, Folder, Trash, Upload } from 'lucide-react';
import Button from '../../ui-elements/Button';

export type FileType = 'image' | 'audio' | 'folder';

export interface ProjectFile {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  type: FileType;
  created_at: string;
}

interface FileItemProps {
  file: ProjectFile;
  onEdit: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
}

const FileItem = ({ file, onEdit, onDelete }: FileItemProps) => {
  // Helper to get file type icon
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <div className="p-1 bg-blue-100 rounded-full"><Upload size={16} className="text-blue-500" /></div>;
      case 'audio':
        return <div className="p-1 bg-purple-100 rounded-full"><Upload size={16} className="text-purple-500" /></div>;
      case 'folder':
        return <div className="p-1 bg-yellow-100 rounded-full"><Folder size={16} className="text-yellow-600" /></div>;
      default:
        return <div className="p-1 bg-gray-100 rounded-full"><Upload size={16} className="text-gray-500" /></div>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
      <div className="flex items-center space-x-3">
        {getFileTypeIcon(file.type)}
        <div>
          <div className="font-medium">{file.name}</div>
          <div className="text-sm text-muted-foreground capitalize">{file.type}</div>
        </div>
      </div>
      <div className="flex space-x-2">
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
    </div>
  );
};

export default FileItem;
