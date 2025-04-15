import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { DragDropContext } from 'react-beautiful-dnd';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import StepNavigationButtons from './components/StepNavigationButtons';
import NotesTabsPanel from './components/NotesTabsPanel';
import NoteDialogsManager from './components/NoteDialogsManager';
import { useNotesManagement } from '@/hooks/report-workflow/useNotesManagement';
import { NotesProvider } from '@/hooks/report-workflow/NotesContext';
import AddNoteDialog from '@/components/dashboard/notes/AddNoteDialog';
import { Note } from '@/utils/noteUtils';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema } from '@/components/dashboard/notes/hooks/useNotesOperations';

const Step4Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempNoteId] = useState(uuidv4());
  const [addNoteRelatedFiles, setAddNoteRelatedFiles] = useState<any[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  
  const {
    notes,
    loading,
    relatedFiles,
    handleOnDragEnd,
    fetchNoteRelatedFiles,
    handleEditNote,
    handleDeleteNote,
    refreshNotes,
    setRelatedFiles
  } = useNotesManagement(projectId);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    }
  });
  
  useEffect(() => {
    const getProjectId = async () => {
      try {
        const { projectId: currentProjectId } = await fetchCurrentWorkflow();
        if (currentProjectId) {
          setProjectId(currentProjectId);
        } else {
          toast({
            title: "Project not found",
            description: "Unable to load project notes",
            variant: "destructive"
          });
          navigate('/dashboard/report-wizard/start');
        }
      } catch (error) {
        console.error("Error fetching workflow:", error);
        toast({
          title: "Error",
          description: "Failed to load workflow information",
          variant: "destructive"
        });
        navigate('/dashboard/report-wizard/start');
      }
    };
    
    getProjectId();
  }, [navigate, toast, fetchCurrentWorkflow]);
  
  const handleBack = async () => {
    if (projectId) {
      await updateWorkflowState(projectId, 3);
    }
    navigate('/dashboard/report-wizard/process');
  };
  
  const handleNext = async () => {
    if (projectId) {
      await updateWorkflowState(projectId, 5);
    }
    navigate('/dashboard/report-wizard/generate');
  };
  
  const handleFileAdded = async () => {
    if (projectId) {
      await refreshNotes();
    }
  };

  const wrappedHandleEditNote = async (note: Note, values: { title: string; content: string; analysis: string; files_relationships_is_locked?: boolean }): Promise<void> => {
    try {
      await handleEditNote(note, values);
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating note:', error);
      return Promise.reject(error);
    }
  };

  const handleAddNote = async (values: { title: string; content: string; analysis: string }) => {
    if (!projectId) return;
    
    try {
      setSaving(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add notes",
          variant: "destructive"
        });
        return;
      }
      
      const { data: positionData } = await supabase
        .from('notes')
        .select('position')
        .eq('project_id', projectId)
        .order('position', { ascending: false })
        .limit(1);
        
      const nextPosition = positionData && positionData.length > 0 
        ? (positionData[0].position || 0) + 1 
        : 1;
      
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          title: values.title,
          content: values.content,
          analysis: values.analysis || null,
          project_id: projectId,
          user_id: userData.user.id,
          position: nextPosition,
          name: `Note ${nextPosition}`,
          metadata: {
            created_from: 'workflow',
            step: 4
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      form.reset();
      setIsAddDialogOpen(false);
      
      await refreshNotes();
      
      toast({
        title: "Success",
        description: "Note added successfully!",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeImagesForNote = (noteId: string) => {
    setAnalyzingImages(true);
    // Logic would be handled through context
  };

  const handleTranscriptionComplete = (text: string) => {
    form.setValue('content', text);
  };
  
  return (
    <NotesProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-none">
          <InstructionsPanel stepNumber={4} />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col overflow-hidden px-4">
            <div className="flex justify-between items-center py-4">
              <h3 className="text-lg font-medium">Project Notes</h3>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </div>
            
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <NotesTabsPanel 
                notes={notes}
                loading={loading}
                onDragEnd={handleOnDragEnd}
                projectId={projectId || ''}
              />
            </DragDropContext>
          </div>
        </div>
        
        <StepNavigationButtons 
          onBack={handleBack}
          onNext={handleNext}
          nextLabel="Next: Generate Report"
        />
        
        <NoteDialogsManager 
          onEditNote={wrappedHandleEditNote}
          onDeleteNote={handleDeleteNote}
          fetchNoteRelatedFiles={fetchNoteRelatedFiles}
          relatedFiles={relatedFiles}
          projectId={projectId}
          onFileAdded={handleFileAdded}
        />
        
        <AddNoteDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          form={form}
          onSubmit={form.handleSubmit(handleAddNote)}
          saving={saving}
          tempNoteId={tempNoteId}
          analyzingImages={analyzingImages}
          relatedFiles={addNoteRelatedFiles}
          onAnalyzeImages={() => handleAnalyzeImagesForNote(tempNoteId)}
          onFileAdded={() => {
            refreshNotes();
          }}
          projectId={projectId || ''}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      </div>
    </NotesProvider>
  );
};

export default Step4Notes;
