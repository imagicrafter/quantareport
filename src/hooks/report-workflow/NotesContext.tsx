
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
  fetchNoteRelatedFiles: (noteId: string) => Promise<void>;
}

const defaultContext: NotesContextType = {
  handleEditNote: async () => {},
  handleDeleteNote: () => {},
  handleAnalyzeImages: () => {},
  handleTranscriptionComplete: () => {},
  relatedFiles: {},
  onFileAdded: () => {},
  fetchNoteRelatedFiles: async () => {}
};

const NotesContext = createContext<NotesContextType>(defaultContext);

export const useNotesContext = () => useContext(NotesContext);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [relatedFiles, setRelatedFiles] = useState<Record<string, NoteFileRelationshipWithType[]>>({});

  const fetchNoteRelatedFiles = async (noteId: string) => {
    try {
      const filesWithTypes = await fetchRelatedFiles(noteId);
      setRelatedFiles(prev => ({
        ...prev,
        [noteId]: filesWithTypes
      }));
    } catch (error) {
      console.error('Error fetching related files for note:', error);
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

  const value = {
    handleEditNote,
    handleDeleteNote,
    handleAnalyzeImages,
    handleTranscriptionComplete,
    relatedFiles,
    onFileAdded,
    fetchNoteRelatedFiles
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
