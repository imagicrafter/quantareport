
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';
import { File as FileIcon, X, Music, FileText } from 'lucide-react';

interface FilePreviewProps {
  file: ProjectFile;
  onDelete: () => void;
}

const FilePreview = ({ file, onDelete }: FilePreviewProps) => {
  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'audio':
        return <Music size={18} className="text-purple-500" />;
      case 'text':
        return <FileText size={18} className="text-green-500" />;
      default:
        return <FileIcon size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative group">
      {file.type === 'image' ? (
        <div className="h-32 w-32 rounded-md overflow-hidden border border-border">
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
        <div className="h-32 w-32 rounded-md overflow-hidden border border-border bg-secondary/30 flex items-center justify-center">
          {getFileIcon(file.type)}
          <span className="text-xs text-muted-foreground mt-2 text-center max-w-[80%] break-words">
            {file.name}
          </span>
        </div>
      )}
      <button
        className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X size={12} className="text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
};

export default FilePreview;
