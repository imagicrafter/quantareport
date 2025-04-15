
import React, { createContext, useContext, useState } from 'react';
import { Note, NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';

interface NotesContextType {
  handleEditNote: (note: Note, values: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }) => Promise<void>;
  handleDeleteNote: (note: Note) => void;
  handleAnalyzeImages: (noteId: string) => void;
  handleTranscriptionComplete: (text: string) => void;
  relatedFiles: Record<string, NoteFileRelationshipWithType[]>;
  onFileAdded: (noteId: string) => void;
  fetchNoteRelatedFiles: (noteId: string) => Promise<NoteFileRelationshipWithType[]>;
  
  // Add the missing setter methods
  setEditNoteHandler: (handler: (note: Note, values?: any) => Promise<void>) => void;
  setDeleteNoteHandler: (handler: (note: Note) => void) => void;
  setAnalyzeImagesHandler: (handler: (noteId: string) => void) => void;
  setTranscriptionCompleteHandler: (handler: (text: string) => void) => void;
  setFileAddedHandler: (handler: (noteId: string) => void) => void;
  setRelatedFilesData: (noteId: string, files: NoteFileRelationshipWithType[]) => void;
}

const defaultContext: NotesContextType = {
  handleEditNote: async () => {},
  handleDeleteNote: () => {},
  handleAnalyzeImages: () => {},
  handleTranscriptionComplete: () => {},
  relatedFiles: {},
  onFileAdded: () => {},
  fetchNoteRelatedFiles: async () => [],
  
  // Default implementations for setter methods
  setEditNoteHandler: () => {},
  setDeleteNoteHandler: () => {},
  setAnalyzeImagesHandler: () => {},
  setTranscriptionCompleteHandler: () => {},
  setFileAddedHandler: () => {},
  setRelatedFilesData: () => {}
};

const NotesContext = createContext<NotesContextType>(defaultContext);

export const useNotesContext = () => useContext(NotesContext);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [relatedFiles, setRelatedFiles] = useState<Record<string, NoteFileRelationshipWithType[]>>({});
  const [editNoteHandler, setEditNoteHandler] = useState<(note: Note, values?: any) => Promise<void>>(async () => {});
  const [deleteNoteHandler, setDeleteNoteHandler] = useState<(note: Note) => void>(() => {});
  const [analyzeImagesHandler, setAnalyzeImagesHandler] = useState<(noteId: string) => void>(() => {});
  const [transcriptionCompleteHandler, setTranscriptionCompleteHandler] = useState<(text: string) => void>(() => {});
  const [fileAddedHandler, setFileAddedHandler] = useState<(noteId: string) => void>(() => {});

  const fetchNoteRelatedFiles = async (noteId: string): Promise<NoteFileRelationshipWithType[]> => {
    try {
      const filesWithTypes = await fetchRelatedFiles(noteId);
      setRelatedFiles(prev => ({
        ...prev,
        [noteId]: filesWithTypes
      }));
      return filesWithTypes;
    } catch (error) {
      console.error('Error fetching related files for note:', error);
      return [];
    }
  };

  const handleEditNote = async (
    note: Note,
    values: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }
  ) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content,
          analysis: values.analysis,
          files_relationships_is_locked: values.files_relationships_is_locked !== undefined
            ? values.files_relationships_is_locked
            : note.files_relationships_is_locked
        })
        .eq('id', note.id);

      if (error) throw error;

      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      throw error;
    }
  };

  const handleDeleteNote = (note: Note) => {
    toast.info('Delete not implemented in this context');
  };

  const handleAnalyzeImages = (noteId: string) => {
    toast.info('Analysis not implemented in this context');
  };

  const handleTranscriptionComplete = (text: string) => {
    // This will be implemented by the consuming component
  };

  const onFileAdded = (noteId: string) => {
    fetchNoteRelatedFiles(noteId);
  };

  const setRelatedFilesData = (noteId: string, files: NoteFileRelationshipWithType[]) => {
    setRelatedFiles(prev => ({
      ...prev,
      [noteId]: files
    }));
  };

  const value = {
    handleEditNote: editNoteHandler || handleEditNote,
    handleDeleteNote: deleteNoteHandler || handleDeleteNote,
    handleAnalyzeImages: analyzeImagesHandler || handleAnalyzeImages,
    handleTranscriptionComplete: transcriptionCompleteHandler || handleTranscriptionComplete,
    relatedFiles,
    onFileAdded: fileAddedHandler || onFileAdded,
    fetchNoteRelatedFiles,
    
    // Expose setter methods
    setEditNoteHandler,
    setDeleteNoteHandler,
    setAnalyzeImagesHandler,
    setTranscriptionCompleteHandler,
    setFileAddedHandler,
    setRelatedFilesData
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
