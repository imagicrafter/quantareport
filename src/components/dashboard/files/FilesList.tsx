
import FileItem, { ProjectFile } from './FileItem';

interface FilesListProps {
  files: ProjectFile[];
  loading: boolean;
  onEditFile: (file: ProjectFile) => void;
  onDeleteFile: (file: ProjectFile) => void;
}

const FilesList = ({ files, loading, onEditFile, onDeleteFile }: FilesListProps) => {
  if (loading) {
    return <div className="py-8 text-center">Loading files...</div>;
  }
  
  if (files.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border rounded-lg">
        No files added yet. Add your first file to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <FileItem 
          key={file.id} 
          file={file} 
          onEdit={onEditFile}
          onDelete={onDeleteFile}
        />
      ))}
    </div>
  );
};

export default FilesList;
