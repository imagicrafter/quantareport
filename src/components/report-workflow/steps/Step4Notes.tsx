
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { DragDropContext } from 'react-beautiful-dnd';

// Import our new components
import StepNavigationButtons from './components/StepNavigationButtons';
import NotesTabsPanel from './components/NotesTabsPanel';
import NoteDialogsManager from './components/NoteDialogsManager';
import { useNotesManagement } from '@/hooks/report-workflow/useNotesManagement';
import { NotesProvider } from '@/hooks/report-workflow/NotesContext';

const Step4Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  
  // Use our custom hook for notes management
  const {
    notes,
    loading,
    relatedFiles,
    handleOnDragEnd,
    fetchNoteRelatedFiles,
    handleEditNote,
    handleDeleteNote
  } = useNotesManagement(projectId);
  
  useEffect(() => {
    const getProjectId = async () => {
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
    };
    
    getProjectId();
  }, []);
  
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
  
  return (
    <NotesProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-none">
          <InstructionsPanel stepNumber={4} />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col overflow-hidden px-4">
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <NotesTabsPanel 
                notes={notes}
                loading={loading}
                onDragEnd={handleOnDragEnd}
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
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          fetchNoteRelatedFiles={fetchNoteRelatedFiles}
          relatedFiles={relatedFiles}
          projectId={projectId}
          onFileAdded={() => {
            const selectedNoteId = notes.length > 0 ? notes[0].id : null;
            if (selectedNoteId) {
              fetchNoteRelatedFiles(selectedNoteId);
            }
          }}
        />
      </div>
    </NotesProvider>
  );
};

export default Step4Notes;
