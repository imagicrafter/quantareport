
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, NoteFormValues } from '@/components/dashboard/notes/hooks/useNotesOperations';
import { Note, NoteFileRelationshipWithType, submitImageAnalysis } from '@/utils/noteUtils';
import EditNoteDialog from '@/components/dashboard/notes/EditNoteDialog';
import DeleteNoteDialog from '@/components/dashboard/notes/DeleteNoteDialog';
import { useNotesContext } from '@/hooks/report-workflow/NotesContext';
import { fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NoteDialogsManagerProps {
  onEditNote: (note: Note, values: NoteFormValues) => Promise<void>;
  onDeleteNote: (note: Note) => Promise<void>;
  fetchNoteRelatedFiles: (noteId: string) => Promise<void>;
  relatedFiles: NoteFileRelationshipWithType[];
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
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const { 
    setEditNoteHandler, 
    setDeleteNoteHandler, 
    setAnalyzeImagesHandler,
    setRelatedFilesData,
    setFileAddedHandler,
    setTranscriptionCompleteHandler,
    relatedFiles: noteRelatedFilesMap
  } = useNotesContext();
  
  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });
  
  const handleEditNote = async (note: Note, values?: any) => {
    if (values) {
      // If values are provided, this is a direct edit
      try {
        await onEditNote(note, values);
      } catch (error) {
        console.error('Error updating note:', error);
      }
      return;
    }
    
    // Otherwise, open the edit dialog
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
  
  const handleAnalyzeImages = async (noteId: string) => {
    if (!projectId) return;
    
    setAnalyzingImages(true);
    console.log(`Analyzing images for note: ${noteId}`);
    
    try {
      // Find the note - either use the selectedNote or fetch it if noteId is provided directly
      let noteToAnalyze = selectedNote;
      
      // If we don't have the selectedNote but we have noteId (from expandable note)
      if (!noteToAnalyze || noteToAnalyze.id !== noteId) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          noteToAnalyze = data as Note;
        }
      }
      
      if (!noteToAnalyze) {
        toast.error('Unable to find note for analysis');
        setAnalyzingImages(false);
        return;
      }
      
      // Get related files for this specific note - either from context or fetch if needed
      let noteImages = noteRelatedFilesMap[noteId] || [];
      
      // If we don't have the related files for this note yet, fetch them
      if (noteImages.length === 0) {
        console.log(`Fetching related files for note: ${noteId}`);
        noteImages = await fetchRelatedFiles(noteId);
        // Save to context for future use
        setRelatedFilesData(noteId, noteImages);
      }
      
      // Filter image files
      const imageRelationships = noteImages.filter(rel => 
        rel.file_type === 'image'
      );
      
      if (imageRelationships.length === 0) {
        toast.warning('No images available for analysis. Add some images to analyze first.');
        setAnalyzingImages(false);
        return;
      }
      
      const imageUrls = imageRelationships.map(rel => rel.file_path);
      
      // Determine test mode based on project name
      const isTestMode = noteToAnalyze.title?.toLowerCase().includes('test') || false;
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for analysis`);
      
      // Submit analysis request
      const success = await submitImageAnalysis(
        noteId,
        projectId,
        imageUrls,
        isTestMode
      );
      
      if (success) {
        toast.success('Image analysis started');
        startPollingForAnalysisCompletion(noteId);
      } else {
        throw new Error('Failed to submit image analysis request');
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('Failed to analyze images');
      setAnalyzingImages(false);
    }
  };
  
  const handleFileAdded = async (noteId: string) => {
    if (noteId) {
      // Fetch the related files for this note
      const files = await fetchRelatedFiles(noteId);
      setRelatedFilesData(noteId, files);
    }
    
    // Notify parent component to refresh notes
    onFileAdded();
  };
  
  const handleTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };
  
  // Register the handlers with the context
  useEffect(() => {
    setEditNoteHandler(handleEditNote);
    setDeleteNoteHandler(handleDeleteNote);
    setAnalyzeImagesHandler(handleAnalyzeImages);
    setFileAddedHandler(handleFileAdded);
    setTranscriptionCompleteHandler(handleTranscriptionComplete);
  }, []);
  
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

  const startPollingForAnalysisCompletion = (noteId: string) => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
    }
    
    const maxAttempts = 30;
    let attempts = 0;
    
    const intervalId = window.setInterval(async () => {
      attempts++;
      console.log(`Checking analysis status: attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Query the note directly from the database instead of using the API endpoint
        const { data, error } = await supabase
          .from('notes')
          .select('analysis')
          .eq('id', noteId)
          .single();
        
        if (error) {
          console.error('Error fetching note:', error);
          return;
        }
        
        if (data && data.analysis) {
          clearInterval(intervalId);
          setPollingInterval(null);
          setAnalyzingImages(false);
          
          // Update form values with the new analysis if the edit dialog is open
          if (isEditDialogOpen && selectedNote && selectedNote.id === noteId) {
            editForm.setValue('analysis', data.analysis);
          } else {
            // For ExpandableNote, we need to update the note in the database
            // The note will be refreshed on the next render
            toast.success('Image analysis completed');
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollingInterval(null);
          setAnalyzingImages(false);
          toast.error('Analysis is taking longer than expected. Please check back later.');
        }
      } catch (error) {
        console.error('Error in polling interval:', error);
      }
    }, 2000);
    
    setPollingInterval(intervalId);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval !== null) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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
        onAnalyzeImages={() => selectedNote && handleAnalyzeImages(selectedNote.id)}
        onFileAdded={() => selectedNote && handleFileAdded(selectedNote.id)}
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
