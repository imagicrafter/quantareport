
import { useNoteForm } from './useNoteForm';
import { useNoteDialogs } from './useNoteDialogs';
import { useNoteAnalysis } from './useNoteAnalysis';
import { useNoteRelationships } from './useNoteRelationships';
import { Note } from '@/utils/noteUtils';
import { supabase } from '@/integrations/supabase/client';

export { formSchema } from './useNoteForm';
export type { NoteFormValues } from './useNoteForm';

interface UseNotesOperationsProps {
  projectId: string;
  projectName: string;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  refreshNotes: () => Promise<void>;
}

export const useNotesOperations = ({
  projectId,
  projectName,
  notes,
  setNotes,
  refreshNotes
}: UseNotesOperationsProps) => {
  const {
    form,
    editForm,
    saving,
    handleAddNote,
    handleEditNote,
  } = useNoteForm(projectId, refreshNotes);

  const {
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedNote,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setSelectedNote,
    handleDeleteNote,
  } = useNoteDialogs(refreshNotes);

  const {
    analyzingImages,
    handleAnalyzeImages,
    tempNoteId,
  } = useNoteAnalysis(projectName);

  const {
    relatedFiles,
    addNoteRelatedFiles,
    setRelatedFiles,
    setAddNoteRelatedFiles,
    fetchFileRelationships,
  } = useNoteRelationships();

  const handleTranscriptionComplete = (text: string) => {
    form.setValue('content', text);
  };

  const handleEditTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };

  // Add the missing functions needed in NotesSection.tsx
  const handleOnDragEnd = async (result: any) => {
    // Placeholder for drag-and-drop functionality
    if (!result.destination) return;
    
    const reorderedNotes = [...notes];
    const [removed] = reorderedNotes.splice(result.source.index, 1);
    reorderedNotes.splice(result.destination.index, 0, removed);
    
    setNotes(reorderedNotes.map((note, index) => ({
      ...note,
      position: index + 1
    })));
    
    try {
      const updates = reorderedNotes.map((note, index) => ({
        id: note.id,
        position: index + 1,
        name: note.name,
        title: note.title,
        project_id: note.project_id,
        user_id: note.user_id
      }));
      
      const { error } = await supabase
        .from('notes')
        .upsert(updates);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating note positions:', error);
    }
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
  };

  return {
    // Form state and handlers
    form,
    editForm,
    saving,
    handleAddNote,
    handleEditNote,

    // Dialog state and handlers
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedNote,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setSelectedNote,
    handleDeleteNote,

    // Analysis state and handlers
    analyzingImages,
    handleAnalyzeImages,
    tempNoteId,

    // File relationships
    relatedFiles,
    addNoteRelatedFiles,
    setRelatedFiles,
    setAddNoteRelatedFiles,
    fetchFileRelationships,

    // Transcription handlers
    handleTranscriptionComplete,
    handleEditTranscriptionComplete,
    
    // Additional handlers needed in NotesSection
    handleOnDragEnd,
    handleAddDialogOpenChange,
  };
};
