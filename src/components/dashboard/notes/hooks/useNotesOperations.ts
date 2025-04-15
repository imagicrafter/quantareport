
import { useNoteForm } from './useNoteForm';
import { useNoteDialogs } from './useNoteDialogs';
import { useNoteAnalysis } from './useNoteAnalysis';
import { useNoteRelationships } from './useNoteRelationships';

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

    // File relationships
    relatedFiles,
    addNoteRelatedFiles,
    setRelatedFiles,
    setAddNoteRelatedFiles,
    fetchFileRelationships,

    // Transcription handlers
    handleTranscriptionComplete,
    handleEditTranscriptionComplete,
  };
};

