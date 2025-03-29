
import React from 'react';
import { GripVertical, Edit, Trash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Note } from '@/utils/noteUtils';

interface NotesListProps {
  notes: Note[];
  loading: boolean;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onDragEnd: (result: any) => void;
}

const NotesList = ({ notes, loading, onEditNote, onDeleteNote, onDragEnd }: NotesListProps) => {
  if (loading) {
    return <div className="py-8 text-center">Loading notes...</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border rounded-lg">
        No notes added yet. Add your first note to get started.
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="notes-list">
        {(provided) => (
          <div 
            className="space-y-2" 
            {...provided.droppableProps} 
            ref={provided.innerRef}
          >
            {notes.map((note, index) => (
              <Draggable key={note.id} draggableId={note.id} index={index}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center w-full">
                      <div 
                        {...provided.dragHandleProps} 
                        className="px-2 cursor-grab"
                      >
                        <GripVertical size={16} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{note.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          className="p-1 rounded-md hover:bg-secondary transition-colors"
                          onClick={() => onEditNote(note)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-1 rounded-md hover:bg-secondary transition-colors"
                          onClick={() => onDeleteNote(note)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
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

export default NotesList;
