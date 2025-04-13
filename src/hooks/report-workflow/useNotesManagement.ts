
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Note, parseNoteMetadata, NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { NoteFormValues } from '@/components/dashboard/notes/hooks/useNotesOperations';
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';

export const useNotesManagement = (projectId: string | null) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedFiles, setRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const { toast } = useToast();

  const fetchNotes = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Use the view to get notes excluding template notes
      const { data, error } = await supabase
        .from('v_project_notes_excluding_template')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive"
        });
      } else {
        const processedNotes = data.map(note => parseNoteMetadata(note));
        setNotes(processedNotes);
      }
    } catch (error) {
      console.error('Error in fetchNotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchNotes(projectId);
    }
  }, [projectId]);

  const handleOnDragEnd = async (result: any) => {
    if (!result.destination || !projectId) return;

    try {
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      
      if (sourceIndex === destinationIndex) return;
      
      const reorderedNotes = [...notes];
      const [removed] = reorderedNotes.splice(sourceIndex, 1);
      reorderedNotes.splice(destinationIndex, 0, removed);
      
      const updatedNotes = reorderedNotes.map((note, index) => ({
        ...note,
        position: index + 1
      }));
      
      setNotes(updatedNotes);
      
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
      
      if (error) {
        console.error('Error updating note positions:', error);
        toast({
          title: "Error",
          description: "Failed to update note order",
          variant: "destructive"
        });
        if (projectId) fetchNotes(projectId);
      }
    } catch (error) {
      console.error('Error in handleOnDragEnd:', error);
    }
  };

  const fetchNoteRelatedFiles = useCallback(async (noteId: string) => {
    if (!noteId) {
      console.log('No note ID provided for fetching related files');
      return;
    }
    
    try {
      console.log('Fetching related files for note:', noteId);
      
      const filesWithTypes = await fetchRelatedFiles(noteId);
      setRelatedFiles(filesWithTypes);
      
      console.log('Found related files:', filesWithTypes.length);
    } catch (error) {
      console.error('Error fetching related files:', error);
    }
  }, []);

  const handleEditNote = async (note: Note, values: NoteFormValues) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content || '',
          analysis: values.analysis || null,
        })
        .eq('id', note.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Note updated successfully!",
      });
      
      if (projectId) fetchNotes(projectId);
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
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
      
      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });
      
      if (projectId) fetchNotes(projectId);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshNotes = useCallback(async () => {
    if (projectId) {
      await fetchNotes(projectId);
    }
  }, [projectId]);

  return {
    notes,
    loading,
    relatedFiles,
    handleOnDragEnd,
    fetchNoteRelatedFiles,
    handleEditNote,
    handleDeleteNote,
    refreshNotes,
    setRelatedFiles
  };
};
