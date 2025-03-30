import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Note, 
  reorderNotes, 
  titleToCamelCase, 
  submitImageAnalysis,
  NoteFileRelationshipWithType 
} from '@/utils/noteUtils';

interface UseNotesOperationsProps {
  projectId: string;
  projectName: string;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  refreshNotes: () => Promise<void>;
}

export const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().optional(),
  analysis: z.string().optional(),
});

export type NoteFormValues = z.infer<typeof formSchema>;

export const useNotesOperations = ({
  projectId,
  projectName,
  notes,
  setNotes,
  refreshNotes
}: UseNotesOperationsProps) => {
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [relatedFiles, setRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const [addNoteRelatedFiles, setAddNoteRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [tempNoteId, setTempNoteId] = useState<string | null>(null);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });

  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });

  const createTemporaryNote = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add notes.',
          variant: 'destructive',
        });
        return null;
      }

      const nextPosition = notes.length > 0 
        ? Math.max(...notes.map(note => note.position || 0)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: 'Temporary Note',
          name: 'temporaryNote',
          content: '',
          project_id: projectId,
          user_id: session.session.user.id,
          position: nextPosition
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating temporary note:', error);
      return null;
    }
  };

  const deleteTemporaryNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting temporary note:', error);
    }
  };

  const handleAddDialogOpenChange = async (open: boolean) => {
    if (open) {
      form.reset();
      setAddNoteRelatedFiles([]);
      const newTempNoteId = await createTemporaryNote();
      if (newTempNoteId) {
        setTempNoteId(newTempNoteId);
      } else {
        return;
      }
    } else if (tempNoteId && !saving) {
      await deleteTemporaryNote(tempNoteId);
      setTempNoteId(null);
      setAddNoteRelatedFiles([]);
    }
    setIsAddDialogOpen(open);
  };

  const handleAddNote = async (values: NoteFormValues) => {
    try {
      setSaving(true);
      
      if (!tempNoteId) {
        toast({
          title: 'Error',
          description: 'No temporary note ID available.',
          variant: 'destructive',
        });
        return;
      }

      const name = titleToCamelCase(values.title);

      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          name: name,
          content: values.content || '',
          analysis: values.analysis || null,
        })
        .eq('id', tempNoteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully!',
      });

      form.reset();
      setAddNoteRelatedFiles([]);
      setIsAddDialogOpen(false);
      refreshNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setTempNoteId(null);
    }
  };

  const handleEditNote = async (values: NoteFormValues) => {
    if (!selectedNote) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content || '',
          analysis: values.analysis || null,
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      refreshNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', selectedNote.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });

      setIsDeleteDialogOpen(false);
      refreshNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOnDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    try {
      const updatedNotes = await reorderNotes(notes, sourceIndex, destinationIndex);
      setNotes(updatedNotes);
      
      toast({
        description: "Note order updated",
      });
    } catch (error) {
      console.error('Error reordering notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note order',
        variant: 'destructive',
      });
    }
  };

  const checkAnalysisStatus = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('analysis')
        .eq('id', noteId)
        .single();
        
      if (error) {
        console.error('Error fetching note status:', error);
        return false;
      }
      
      if (data && data.analysis) {
        console.log('Analysis completed:', data.analysis.substring(0, 50) + '...');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return false;
    }
  };

  const startPollingForAnalysisCompletion = (noteId: string, isAdd: boolean = false) => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
    }
    
    const maxAttempts = 30;
    let attempts = 0;
    
    const intervalId = window.setInterval(async () => {
      attempts++;
      console.log(`Checking analysis status: attempt ${attempts}/${maxAttempts}`);
      
      const isComplete = await checkAnalysisStatus(noteId);
      
      if (isComplete) {
        clearInterval(intervalId);
        setPollingInterval(null);
        setAnalyzingImages(false);
        
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();
          
        if (!error && data) {
          if (isAdd) {
            form.setValue('analysis', data.analysis || '');
          } else {
            editForm.setValue('analysis', data.analysis || '');
            setSelectedNote(prevNote => prevNote ? { ...prevNote, analysis: data.analysis } : null);
          }
          toast({
            title: 'Success',
            description: 'Image analysis completed',
          });
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setPollingInterval(null);
        setAnalyzingImages(false);
        toast({
          title: 'Warning',
          description: 'Analysis is taking longer than expected. Please check back later.',
          variant: 'destructive',
        });
      }
    }, 2000);
    
    setPollingInterval(intervalId);
  };

  const handleAnalyzeImages = async (isAdd: boolean = false) => {
    const noteId = isAdd ? tempNoteId : selectedNote?.id;
    if (!noteId) return;
    
    setAnalyzingImages(true);
    
    try {
      const imageRelationships = (isAdd ? addNoteRelatedFiles : relatedFiles).filter(rel => 
        rel.file_type === 'image'
      );
      
      if (imageRelationships.length === 0) {
        toast({
          title: 'Info',
          description: 'No images available for analysis. Add some images to analyze first.',
        });
        setAnalyzingImages(false);
        return;
      }
      
      const imageUrls = imageRelationships.map(rel => rel.file_path);
      
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      const success = await submitImageAnalysis(
        noteId,
        projectId,
        imageUrls,
        isTestMode
      );
      
      if (!success) {
        throw new Error('Failed to submit image analysis request');
      }
      
      toast({
        title: 'Success',
        description: 'Image analysis started',
      });
      startPollingForAnalysisCompletion(noteId, isAdd);
      
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze images',
        variant: 'destructive',
      });
      setAnalyzingImages(false);
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    form.setValue('content', text);
  };

  const handleEditTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval !== null) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
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
  };
};
