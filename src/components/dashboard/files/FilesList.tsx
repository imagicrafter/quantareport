
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import FileItem, { ProjectFile } from './FileItem';

interface FilesListProps {
  files: ProjectFile[];
  loading: boolean;
  onEditFile: (file: ProjectFile) => void;
  onDeleteFile: (file: ProjectFile) => void;
  onReorderFiles: (result: DropResult) => void;
}

const FilesList = ({ files, loading, onEditFile, onDeleteFile, onReorderFiles }: FilesListProps) => {
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
    <DragDropContext onDragEnd={onReorderFiles}>
      <Droppable droppableId="files-list">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <Draggable key={file.id} draggableId={file.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`${snapshot.isDragging ? 'opacity-70' : ''}`}
                  >
                    <FileItem 
                      file={file} 
                      onEdit={onEditFile}
                      onDelete={onDeleteFile}
                      dragHandleProps={provided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default FilesList;
