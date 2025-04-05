
import { ScrollArea } from '@/components/ui/scroll-area';
import FilesList from '../FilesList';
import { ProjectFile } from '../FileItem';
import { DropResult } from 'react-beautiful-dnd';

interface FilesContainerProps {
  files: ProjectFile[];
  loading: boolean;
  onEditFile: (file: ProjectFile) => void;
  onDeleteFile: (file: ProjectFile) => void;
  onReorderFiles: (result: DropResult) => void;
}

const FilesContainer = ({ 
  files, 
  loading, 
  onEditFile, 
  onDeleteFile, 
  onReorderFiles 
}: FilesContainerProps) => {
  return (
    <div className="flex-grow mt-4 overflow-hidden">
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="pb-8">
          <FilesList 
            files={files}
            loading={loading}
            onEditFile={onEditFile}
            onDeleteFile={onDeleteFile}
            onReorderFiles={onReorderFiles}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default FilesContainer;
