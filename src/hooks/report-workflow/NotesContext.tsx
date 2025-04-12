
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Note } from '@/utils/noteUtils';

interface NotesContextType {
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (note: Note) => void;
  setEditNoteHandler: (handler: (note: Note) => void) => void;
  setDeleteNoteHandler: (handler: (note: Note) => void) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with no-op functions to avoid undefined calls
  const [editNoteHandler, setEditNoteHandler] = useState<(note: Note) => void>(() => () => {
    console.log('Edit note handler not initialized yet');
  });
  
  const [deleteNoteHandler, setDeleteNoteHandler] = useState<(note: Note) => void>(() => () => {
    console.log('Delete note handler not initialized yet');
  });

  const handleEditNote = useCallback((note: Note) => {
    editNoteHandler(note);
  }, [editNoteHandler]);

  const handleDeleteNote = useCallback((note: Note) => {
    deleteNoteHandler(note);
  }, [deleteNoteHandler]);

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
