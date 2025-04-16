
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { Note, NoteFileRelationshipWithType } from '@/utils/noteUtils';

interface NotesContextType {
  handleEditNote: (note: Note, values?: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }) => Promise<void>;
  handleDeleteNote: (note: Note) => void;
  setEditNoteHandler: (handler: (note: Note, values?: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }) => Promise<void>) => void;
  setDeleteNoteHandler: (handler: (note: Note) => void) => void;
  handleAnalyzeImages: (noteId: string) => void;
  setAnalyzeImagesHandler: (handler: (noteId: string) => void) => void;
  relatedFiles: Record<string, NoteFileRelationshipWithType[]>;
  setRelatedFilesData: (noteId: string, files: NoteFileRelationshipWithType[]) => void;
  onFileAdded: (noteId: string) => void;
  setFileAddedHandler: (handler: (noteId: string) => void) => void;
  handleTranscriptionComplete: (text: string) => void;
  setTranscriptionCompleteHandler: (handler: (text: string) => void) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  // Use refs to maintain function identity across renders
  const editNoteHandlerRef = useRef<(note: Note, values?: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }) => Promise<void>>(async () => {
    console.log('Edit note handler not initialized yet');
  });
  
  const deleteNoteHandlerRef = useRef<(note: Note) => void>(() => {
    console.log('Delete note handler not initialized yet');
  });

  const analyzeImagesHandlerRef = useRef<(noteId: string) => void>(() => {
    console.log('Analyze images handler not initialized yet');
  });

  const fileAddedHandlerRef = useRef<(noteId: string) => void>(() => {
    console.log('File added handler not initialized yet');
  });

  const transcriptionCompleteHandlerRef = useRef<(text: string) => void>(() => {
    console.log('Transcription complete handler not initialized yet');
  });
  
  // Keep track of related files for each note
  const [relatedFilesMap, setRelatedFilesMap] = useState<Record<string, NoteFileRelationshipWithType[]>>({});
  
  const setEditNoteHandler = useCallback((handler: (note: Note, values?: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }) => Promise<void>) => {
    editNoteHandlerRef.current = handler;
  }, []);

  const setDeleteNoteHandler = useCallback((handler: (note: Note) => void) => {
    deleteNoteHandlerRef.current = handler;
  }, []);

  const setAnalyzeImagesHandler = useCallback((handler: (noteId: string) => void) => {
    analyzeImagesHandlerRef.current = handler;
  }, []);

  const setFileAddedHandler = useCallback((handler: (noteId: string) => void) => {
    fileAddedHandlerRef.current = handler;
  }, []);

  const setTranscriptionCompleteHandler = useCallback((handler: (text: string) => void) => {
    transcriptionCompleteHandlerRef.current = handler;
  }, []);

  const setRelatedFilesData = useCallback((noteId: string, files: NoteFileRelationshipWithType[]) => {
    setRelatedFilesMap(prev => ({
      ...prev,
      [noteId]: files
    }));
  }, []);

  const handleEditNote = useCallback(async (note: Note, values?: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }) => {
    return editNoteHandlerRef.current(note, values);
  }, []);

  const handleDeleteNote = useCallback((note: Note) => {
    deleteNoteHandlerRef.current(note);
  }, []);

  const handleAnalyzeImages = useCallback((noteId: string) => {
    analyzeImagesHandlerRef.current(noteId);
  }, []);

  const onFileAdded = useCallback((noteId: string) => {
    fileAddedHandlerRef.current(noteId);
  }, []);

  const handleTranscriptionComplete = useCallback((text: string) => {
    transcriptionCompleteHandlerRef.current(text);
  }, []);

  return (
    <NotesContext.Provider 
      value={{ 
        handleEditNote, 
        handleDeleteNote,
        setEditNoteHandler,
        setDeleteNoteHandler,
        handleAnalyzeImages,
        setAnalyzeImagesHandler,
        relatedFiles: relatedFilesMap,
        setRelatedFilesData,
        onFileAdded,
        setFileAddedHandler,
        handleTranscriptionComplete,
        setTranscriptionCompleteHandler
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
