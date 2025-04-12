
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Note } from '@/utils/noteUtils';

interface NotesContextType {
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (note: Note) => void;
  setEditNoteHandler: (handler: (note: Note) => void) => void;
  setDeleteNoteHandler: (handler: (note: Note) => void) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [editNoteHandler, setEditNoteHandler] = useState<(note: Note) => void>(() => () => {});
  const [deleteNoteHandler, setDeleteNoteHandler] = useState<(note: Note) => void>(() => () => {});

  const handleEditNote = (note: Note) => {
    editNoteHandler(note);
  };

  const handleDeleteNote = (note: Note) => {
    deleteNoteHandler(note);
  };

  return (
    <NotesContext.Provider 
      value={{ 
        handleEditNote, 
        handleDeleteNote, 
        setEditNoteHandler,
        setDeleteNoteHandler 
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotesContext = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
};
