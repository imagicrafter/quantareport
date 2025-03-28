
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DropResult } from 'react-beautiful-dnd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { reorderFiles } from '@/utils/fileUtils';
import FileItem, { ProjectFile } from './FileItem';

export interface FilesListProps {
  projectId: string;
  refreshTrigger: number;
  onFileChange: () => void;
}

const FilesList = ({ projectId, refreshTrigger, onFileChange }: FilesListProps) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, [projectId, refreshTrigger]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditFile = (file: ProjectFile) => {
    // This would be implemented when needed
    console.log('Edit file:', file);
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    // This would be implemented when needed
    console.log('Delete file:', file);
  };

  const handleReorderFiles = async (result: DropResult) => {
    // Skip if dropped outside the list
    if (!result.destination) return;
    
    // Skip if dropped in the same position
    if (result.destination.index === result.source.index) return;
    
    try {
      const reorderedFiles = await reorderFiles(
        files, 
        result.source.index, 
        result.destination.index
      );
      
      setFiles(reorderedFiles);
      onFileChange();
    } catch (error) {
      console.error('Error reordering files:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder files. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading files...</div>;
  }
  
  if (!files || files.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border rounded-lg">
        No files added yet. Add your first file to get started.
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleReorderFiles}>
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
                      index={index}
                      onEdit={handleEditFile}
                      onDelete={handleDeleteFile}
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
