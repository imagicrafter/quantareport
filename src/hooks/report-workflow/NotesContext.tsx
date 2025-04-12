
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { Note } from '@/utils/noteUtils';

interface NotesContextType {
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (note: Note) => void;
  setEditNoteHandler: (handler: (note: Note) => void) => void;
  setDeleteNoteHandler: (handler: (note: Note) => void) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  // Use refs to maintain function identity across renders
  const editNoteHandlerRef = useRef<(note: Note) => void>(() => {
    console.log('Edit note handler not initialized yet');
  });
  
  const deleteNoteHandlerRef = useRef<(note: Note) => void>(() => {
    console.log('Delete note handler not initialized yet');
  });
  
  const setEditNoteHandler = useCallback((handler: (note: Note) => void) => {
    editNoteHandlerRef.current = handler;
  }, []);

  const setDeleteNoteHandler = useCallback((handler: (note: Note) => void) => {
    deleteNoteHandlerRef.current = handler;
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    editNoteHandlerRef.current(note);
  }, []);

  const handleDeleteNote = useCallback((note: Note) => {
    deleteNoteHandlerRef.current(note);
  }, []);

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
