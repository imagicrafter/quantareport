
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, NoteFormValues } from '@/components/dashboard/notes/hooks/useNotesOperations';
import { Note } from '@/utils/noteUtils';
import EditNoteDialog from '@/components/dashboard/notes/EditNoteDialog';
import DeleteNoteDialog from '@/components/dashboard/notes/DeleteNoteDialog';
import { useNotesContext } from '@/hooks/report-workflow/NotesContext';

interface NoteDialogsManagerProps {
  onEditNote: (note: Note, values: NoteFormValues) => Promise<void>;
  onDeleteNote: (note: Note) => Promise<void>;
  fetchNoteRelatedFiles: (noteId: string) => Promise<void>;
  relatedFiles: any[];
  projectId: string | null;
  onFileAdded: () => void;
}

const NoteDialogsManager = ({
  onEditNote,
  onDeleteNote,
  fetchNoteRelatedFiles,
  relatedFiles,
  projectId,
  onFileAdded
}: NoteDialogsManagerProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const { setEditNoteHandler, setDeleteNoteHandler } = useNotesContext();
  
  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });
  
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    editForm.reset({
      title: note.title,
      content: note.content || '',
      analysis: note.analysis || '',
    });
    
    if (note.id) {
      fetchNoteRelatedFiles(note.id);
    }
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteDialogOpen(true);
  };
  
  // Register the handlers with the context
  useEffect(() => {
    setEditNoteHandler(handleEditNote);
    setDeleteNoteHandler(handleDeleteNote);
    
    return () => {
      // Clean up by setting handlers to no-ops when component unmounts
      setEditNoteHandler(() => () => {});
      setDeleteNoteHandler(() => () => {});
    };
  }, [setEditNoteHandler, setDeleteNoteHandler]);
  
  const handleEditNoteSubmit = async () => {
    if (!selectedNote) return;
    
    try {
      setSaving(true);
      const values = editForm.getValues();
      await onEditNote(selectedNote, values);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error in handleEditNoteSubmit:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteNoteSubmit = async () => {
    if (!selectedNote) return;
    
    try {
      setSaving(true);
      await onDeleteNote(selectedNote);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error in handleDeleteNoteSubmit:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleAnalyzeImages = async () => {
    setAnalyzingImages(true);
    setTimeout(() => {
      setAnalyzingImages(false);
    }, 1000);
  };
  
  const handleTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };

  return (
    <>
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
        onFileAdded={onFileAdded}
        projectId={projectId || ''}
        onTranscriptionComplete={handleTranscriptionComplete}
      />
      
      <DeleteNoteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteNoteSubmit}
        saving={saving}
      />
    </>
  );
};

export default NoteDialogsManager;
