
import { Grip, FileImage, Music, File, Folder, FileText, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type FileType = 'image' | 'audio' | 'text' | 'folder' | 'transcription' | 'other';

export interface ProjectFile {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  type: FileType;
  created_at: string;
  project_id: string;
  user_id: string;
  position: number;
  size?: number;
}

// Add the index prop to FileItemProps
export interface FileItemProps {
  file: ProjectFile;
  onEdit: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  dragHandleProps?: any;
  index: number; // Add this prop
}

const FileItem = ({ file, onEdit, onDelete, dragHandleProps, index }: FileItemProps) => {
  const getFileTypeIcon = (type: FileType) => {
    switch (type) {
      case 'image':
        return <FileImage size={18} className="text-blue-500" />;
      case 'audio':
        return <Music size={18} className="text-purple-500" />;
      case 'text':
        return <FileText size={18} className="text-green-500" />;
      case 'folder':
        return <Folder size={18} className="text-yellow-600" />;
      case 'transcription':
        return <FileText size={18} className="text-emerald-600" />;
      default:
        return <File size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-card border rounded-md group hover:border-primary/50">
      <div className="flex items-center space-x-3">
        <div {...dragHandleProps} className="cursor-grab opacity-50 group-hover:opacity-100">
          <Grip size={16} />
        </div>
        
        {file.type === 'image' ? (
          <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
            <img 
              src={file.file_path} 
              alt={file.name} 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>
        ) : (
          <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded">
            {getFileTypeIcon(file.type)}
          </div>
        )}
        
        <div>
          <div className="font-medium truncate max-w-[200px]">{file.name}</div>
          <div className="text-xs text-muted-foreground flex items-center space-x-1">
            <span className="capitalize">{file.type}</span>
            {file.size && <span>• {formatFileSize(file.size)}</span>}
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded">
          <MoreVertical size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(file)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(file)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Format file size helper function
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileItem;
