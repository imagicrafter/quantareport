
import { useEffect } from 'react';
import { useNotes } from './notes/hooks/useNotes';
import { useNotesOperations } from './notes/hooks/useNotesOperations';
import { useNoteFileRelationships } from './notes/hooks/useNoteFileRelationships';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { supabase } from '@/integrations/supabase/client';
import NotesSectionHeader from './notes/NotesSectionHeader';
import NotesContainer from './notes/NotesContainer';
import AddNoteDialog from './notes/AddNoteDialog';
import EditNoteDialog from './notes/EditNoteDialog';
import DeleteNoteDialog from './notes/DeleteNoteDialog';

interface NotesSectionProps {
  projectId: string;
}

const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { notes, setNotes, loading, projectName, refreshNotes } = useNotes(projectId);
  
  const {
    form,
    editForm,
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedNote,
    saving,
    relatedFiles,
    addNoteRelatedFiles,
    analyzingImages,
    tempNoteId,
    handleAddDialogOpenChange,
    handleAddNote,
    handleEditNote,
    handleDeleteNote,
    handleOnDragEnd,
    handleAnalyzeImages,
    handleTranscriptionComplete,
    handleEditTranscriptionComplete,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setSelectedNote,
    setRelatedFiles,
    setAddNoteRelatedFiles,
    fetchFileRelationships
  } = useNotesOperations({
    projectId,
    projectName,
    notes,
    setNotes,
    refreshNotes
  });

  const { handleAddNoteRelationshipChange } = useNoteFileRelationships();

  // Fetch related files when editing a note
  const handleEditNoteClick = async (note: any) => {
    setSelectedNote(note);
    editForm.reset({
      title: note.title,
      content: note.content,
      analysis: note.analysis || '',
    });
    const files = await fetchFileRelationships(note.id);
    setRelatedFiles(files);
    setIsEditDialogOpen(true);
  };

  // Handle file relationships for the add note dialog
  const handleAddNoteFileRelationship = handleAddNoteRelationshipChange(
    addNoteRelatedFiles,
    setAddNoteRelatedFiles,
    tempNoteId,
    async (noteId) => {
      const files = await fetchFileRelationships(noteId);
      setRelatedFiles(files);
    }
  );

  // Handle file relationships for the edit note dialog
  const handleEditNoteFileRelationship = async () => {
    if (selectedNote) {
      const files = await fetchFileRelationships(selectedNote.id);
      setRelatedFiles(files);
    }
  };

  // Function to wrap the form submission handlers to match expected signatures
  const handleAddNoteSubmit = () => {
    form.handleSubmit((values) => handleAddNote(values))();
  };

  const handleEditNoteSubmit = () => {
    if (selectedNote) {
      editForm.handleSubmit((values) => handleEditNote(selectedNote, values))();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <NotesSectionHeader 
        onAddNote={() => handleAddDialogOpenChange(true)} 
      />

      <NotesContainer 
        notes={notes}
        loading={loading}
        onEditNote={handleEditNoteClick}
        onDeleteNote={(note) => {
          setSelectedNote(note);
          setIsDeleteDialogOpen(true);
        }}
        onDragEnd={handleOnDragEnd}
      />

      <AddNoteDialog
        open={isAddDialogOpen}
        onOpenChange={handleAddDialogOpenChange}
        form={form}
        onSubmit={handleAddNoteSubmit}
        saving={saving}
        tempNoteId={tempNoteId}
        analyzingImages={analyzingImages}
        relatedFiles={addNoteRelatedFiles}
        onAnalyzeImages={() => handleAnalyzeImages(true)}
        onFileAdded={handleAddNoteFileRelationship}
        projectId={projectId}
        onTranscriptionComplete={handleTranscriptionComplete}
      />

      <EditNoteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        form={editForm}
        onSubmit={handleEditNoteSubmit}
        saving={saving}
        selectedNote={selectedNote}
        analyzingImages={analyzingImages}
        relatedFiles={relatedFiles}
        onAnalyzeImages={handleAnalyzeImages}
        onFileAdded={handleEditNoteFileRelationship}
        projectId={projectId}
        onTranscriptionComplete={handleEditTranscriptionComplete}
      />

      <DeleteNoteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteNote}
        saving={saving}
      />
    </div>
  );
};

export default NotesSection;
