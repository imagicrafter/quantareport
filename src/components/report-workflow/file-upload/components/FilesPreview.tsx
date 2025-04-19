
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import FilePreview from './FilePreview';

interface FilesPreviewProps {
  files: ProjectFile[];
  onFileClick: (file: ProjectFile) => void;
  onFileDelete: (file: ProjectFile) => void;
}

const FilesPreview = ({ files, onFileClick, onFileDelete }: FilesPreviewProps) => {
  if (files.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {files.map((file) => (
        <div 
          key={file.id} 
          onClick={() => file.type === 'image' && onFileClick(file)}
          className={file.type === 'image' ? 'cursor-pointer' : ''}
        >
          <FilePreview
            file={file}
            onDelete={() => onFileDelete(file)}
          />
        </div>
      ))}
    </div>
  );
};

export default FilesPreview;
