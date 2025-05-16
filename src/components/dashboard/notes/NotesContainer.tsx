
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotesList from './NotesList';
import { Note } from '@/utils/noteUtils';

interface NotesContainerProps {
  notes: Note[];
  loading: boolean;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onDragEnd: (result: any) => void;
}

const NotesContainer = ({ 
  notes, 
  loading, 
  onEditNote, 
  onDeleteNote, 
  onDragEnd 
}: NotesContainerProps) => {
  return (
    <div className="flex-grow mt-4 overflow-hidden">
      <ScrollArea className="h-[calc(100vh-250px)]">
        <NotesList 
          notes={notes}
          loading={loading}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
          onDragEnd={onDragEnd}
        />
      </ScrollArea>
    </div>
  );
};

export default NotesContainer;
