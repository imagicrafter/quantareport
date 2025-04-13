import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import StepBanner from '../StepBanner';
import { useTemplateData } from '@/hooks/report-workflow/useTemplateData';
import { useProjectData } from '@/hooks/report-workflow/useProjectData';
import { useReportSave } from '@/hooks/report-workflow/useReportSave';
import {
  ReportModeSelector,
  ReportNameInput,
  TemplateDisplay,
  ProjectSelector,
  ActionButtons,
  LoadingSpinner,
  InstructionsPanel
} from '@/components/report-workflow/start-report';
import TemplateNotesForm from '../TemplateNotesForm';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Step1Start = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const [workflowState, setWorkflowState] = useState<number | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitAction, setExitAction] = useState<{
    type: 'mode-change' | 'project-change';
    value: string | 'new';
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  
  // Custom hooks for data and operations
  const {
    defaultTemplate,
    isLoading,
    templateNotes,
    templateNoteValues,
    setTemplateNotes,
    setTemplateNoteValues,
    handleInputChange,
    resetTemplateNoteValues,
    fetchDefaultTemplate
  } = useTemplateData();
  
  const {
    existingProjects,
    selectedProjectId,
    reportName,
    setSelectedProjectId,
    setReportName,
    handleProjectSelect,
    resetForm
  } = useProjectData();
  
  const { isSaving, saveReport } = useReportSave();
  
  // Modified to ensure we don't preselect projects when coming back to Step 1
  useEffect(() => {
    const checkWorkflowState = async () => {
      try {
        const { workflowState } = await fetchCurrentWorkflow();
        setWorkflowState(workflowState);
        
        // Always reset form when arriving at Step 1
        resetForm();
        resetTemplateNoteValues();
        
        // If we have a default template, fetch it
        if (defaultTemplate?.id) {
          fetchDefaultTemplate();
        }
      } catch (error) {
        console.error('Error checking workflow state:', error);
      }
    };
    
    checkWorkflowState();
  }, [fetchCurrentWorkflow, resetForm, resetTemplateNoteValues, defaultTemplate?.id, fetchDefaultTemplate]);
  
  const handleReportModeChange = (mode: 'new' | 'update') => {
    // If we're in workflow state 1 and changing mode, show the exit dialog
    if (workflowState === 1 && selectedProjectId && mode !== reportMode) {
      setExitAction({
        type: 'mode-change',
        value: mode
      });
      setShowExitDialog(true);
      return;
    }
    
    setReportMode(mode);
  };

  const handleProjectChange = (projectId: string) => {
    // If we're in workflow state 1 and changing projects, show the exit dialog
    if (workflowState === 1 && selectedProjectId && projectId !== selectedProjectId) {
      setExitAction({
        type: 'project-change',
        value: projectId
      });
      setShowExitDialog(true);
      return;
    }
    
    handleProjectSelect(
      projectId, 
      (loading: boolean) => isLoading, 
      (template: any) => defaultTemplate, 
      setTemplateNotes, 
      setTemplateNoteValues
    );
  };

  // Function to reset workflow state to step 1
  const resetWorkflowToStartStep = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // If there's a selected project, update its workflow state to 0
      if (selectedProjectId) {
        await supabase
          .from('project_workflow')
          .update({ 
            workflow_state: 1, // Reset to Step 1
            last_edited_at: new Date().toISOString()
          })
          .eq('project_id', selectedProjectId)
          .eq('user_id', userData.user.id);
      }
    } catch (error) {
      console.error('Error resetting workflow state:', error);
    }
  };

  // Handle exit dialog confirmation
  const handleExitConfirm = async () => {
    try {
      if (selectedProjectId) {
        // Reset workflow state to 0
        await updateWorkflowState(selectedProjectId, 0);
        console.log(`Workflow state reset to 0 for project ${selectedProjectId}`);
      }
      
      setShowExitDialog(false);
      
      // Apply the change that was requested
      if (exitAction) {
        if (exitAction.type === 'mode-change') {
          setReportMode(exitAction.value as 'new' | 'update');
          if (exitAction.value === 'new') {
            resetForm();
            resetTemplateNoteValues();
            
            // If defaultTemplate exists and template has id, fetch template notes
            if (defaultTemplate?.id) {
              fetchDefaultTemplate();
            }
          }
        } else if (exitAction.type === 'project-change') {
          handleProjectSelect(
            exitAction.value, 
            (loading: boolean) => isLoading, 
            (template: any) => defaultTemplate, 
            setTemplateNotes, 
            setTemplateNoteValues
          );
        }
      }
    } catch (error) {
      console.error('Error handling exit confirmation:', error);
    }
  };

  // Handle exit dialog cancellation
  const handleExitCancel = () => {
    setShowExitDialog(false);
    setExitAction(null);
  };
  
  const handleSave = () => {
    if (!defaultTemplate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No template available. Please contact your administrator.',
      });
      return;
    }
    
    // Reset workflow state before saving in case there was a previous state
    resetWorkflowToStartStep();
    
    saveReport({
      reportMode,
      reportName,
      templateId: defaultTemplate.id,
      selectedProjectId,
      templateNotes,
      templateNoteValues
    });
  };
  
  const handleCancel = () => {
    resetForm();
    resetTemplateNoteValues();
  };

  const handleStepClick = (step: number) => {
    // In future implementations, this will navigate to the appropriate step
    toast({
      description: `Step ${step} will be implemented in a future update.`,
    });
  };

  return (
    <div className="container mx-auto px-4 pt-8 pb-12">
      <StepBanner 
        step={1}
        isActive={true}
        onClick={() => {}}
      />
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Start New Report</h2>
        <p className="text-muted-foreground">Configure your report details to get started.</p>
      </div>
      
      {/* Instructions Panel */}
      <InstructionsPanel stepNumber={1} />
      
      {/* Report Mode Selection */}
      <ReportModeSelector 
        value={reportMode}
        onChange={handleReportModeChange}
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Report Name and Template Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
            <div>
              {reportMode === 'new' ? (
                <ReportNameInput 
                  value={reportName}
                  onChange={setReportName}
                />
              ) : (
                <ProjectSelector
                  projects={existingProjects}
                  selectedId={selectedProjectId}
                  onSelect={handleProjectChange}
                />
              )}
            </div>
            <TemplateDisplay templateName={defaultTemplate?.name} />
          </div>
          
          {/* Template Notes Form - shown for both modes when data is available */}
          {(reportMode === 'new' || (reportMode === 'update' && selectedProjectId)) && (
            <>
              {templateNotes.length > 0 ? (
                <TemplateNotesForm
                  templateNotes={templateNotes}
                  values={templateNoteValues}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="text-center py-4 bg-accent/30 rounded-md max-w-3xl mx-auto">
                  <p>No template notes available.</p>
                </div>
              )}
            </>
          )}
          
          {/* Action Buttons */}
          <ActionButtons
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            isDisabled={reportMode === 'update' && !selectedProjectId}
          />
        </>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Report Creation?</DialogTitle>
            <DialogDescription>
              You are about to {exitAction?.type === 'mode-change' ? 'change report mode' : 'select a different project'} 
              while in an active workflow. Your progress will be saved, but you'll need to start from the beginning if you 
              want to continue with this project in the future.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleExitCancel}>Cancel</Button>
            <Button onClick={handleExitConfirm}>Yes, Exit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step1Start;
