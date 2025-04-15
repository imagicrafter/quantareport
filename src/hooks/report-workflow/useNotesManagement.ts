
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Note, NoteFileRelationshipWithType, parseNoteMetadata } from '@/utils/noteUtils';
import { toast } from 'sonner';
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';

export const useNotesManagement = (projectId: string | null) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedFiles, setRelatedFiles] = useState<Record<string, NoteFileRelationshipWithType[]>>({});

  const fetchNotes = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });
      
      if (error) throw error;

      // Process metadata for each note
      const processedNotes = data.map(parseNoteMetadata);
      setNotes(processedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchNotes();
    }
  }, [projectId]);

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
      toast.error('Failed to load related files');
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

      // Update the note in the local state
      setNotes(prevNotes => 
        prevNotes.map(n => 
          n.id === note.id 
            ? { 
                ...n, 
                title: values.title, 
                content: values.content, 
                analysis: values.analysis,
                files_relationships_is_locked: values.files_relationships_is_locked !== undefined
                  ? values.files_relationships_is_locked
                  : n.files_relationships_is_locked
              } 
            : n
        )
      );

      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      throw error;
    }
  };

  const handleDeleteNote = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;

      // Remove the note from the local state
      setNotes(prevNotes => prevNotes.filter(n => n.id !== note.id));
      
      // Remove related files from the local state
      setRelatedFiles(prev => {
        const newRelatedFiles = { ...prev };
        delete newRelatedFiles[note.id];
        return newRelatedFiles;
      });

      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleOnDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const reorderedNotes = [...notes];
    const [removed] = reorderedNotes.splice(result.source.index, 1);
    reorderedNotes.splice(result.destination.index, 0, removed);
    
    // Update positions in the local state
    const updatedNotes = reorderedNotes.map((note, index) => ({
      ...note,
      position: index + 1
    }));
    
    setNotes(updatedNotes);
    
    // Update positions in the database
    try {
      const updates = updatedNotes.map(note => ({
        id: note.id,
        position: note.position,
        name: note.name,
        title: note.title,
        project_id: note.project_id,
        user_id: note.user_id
      }));
      
      const { error } = await supabase
        .from('notes')
        .upsert(updates);
      
      if (error) throw error;
      
      toast.success('Note order updated');
    } catch (error) {
      console.error('Error updating note positions:', error);
      toast.error('Failed to update note order');
      
      // Revert to the original order on error
      fetchNotes();
    }
  };

  return {
    notes,
    loading,
    relatedFiles,
    setRelatedFiles,
    refreshNotes: fetchNotes,
    fetchNoteRelatedFiles,
    handleEditNote,
    handleDeleteNote,
    handleOnDragEnd,
  };
};
