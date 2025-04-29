
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
  ProjectSelector,
  ActionButtons,
  LoadingSpinner,
  InstructionsPanel,
  TemplateSelector,
} from '@/components/report-workflow/start-report';
import TemplateNotesColumns from '../TemplateNotesColumns';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Step1Start = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const [workflowState, setWorkflowState] = useState<number | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitAction, setExitAction] = useState<{
    type: 'mode-change' | 'project-change' | 'template-change';
    value: string | 'new';
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  
  // Get template data and functions from the hook
  const {
    defaultTemplate,
    selectedTemplate,
    isLoading,
    templateNotes,
    templateNoteValues,
    setTemplateNotes,
    setTemplateNoteValues,
    handleInputChange,
    resetTemplateNoteValues,
    fetchDefaultTemplate,
    fetchTemplateById,
  } = useTemplateData();

  // Get project data and functions from the hook
  const {
    existingProjects,
    selectedProjectId,
    reportName,
    setSelectedProjectId,
    setReportName,
    handleProjectSelect,
    resetForm
  } = useProjectData();

  // Get report save functionality from the hook
  const { isSaving, saveReport } = useReportSave();

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const { workflowState } = await fetchCurrentWorkflow();
        setWorkflowState(workflowState);
        
        resetForm();
        resetTemplateNoteValues();
        
        if (defaultTemplate?.id) {
          fetchDefaultTemplate();
        }
      } catch (error) {
        console.error('Error initializing form:', error);
      }
    };
    
    initializeForm();
  }, []);

  const handleReportModeChange = (mode: 'new' | 'update') => {
    if (workflowState === 1 && selectedProjectId && mode !== reportMode) {
      setExitAction({
        type: 'mode-change',
        value: mode
      });
      setShowExitDialog(true);
      return;
    }
    
    setReportMode(mode);
    
    if (mode === 'new') {
      resetForm();
      resetTemplateNoteValues();
      
      if (defaultTemplate?.id) {
        fetchDefaultTemplate();
      }
    }
  };

  const handleProjectChange = (projectId: string) => {
    if (workflowState === 1 && selectedProjectId && projectId !== selectedProjectId) {
      setExitAction({
        type: 'project-change',
        value: projectId
      });
      setShowExitDialog(true);
      return;
    }
    
    setSelectedProjectId(projectId);
    
    handleProjectSelect(
      projectId, 
      () => isLoading, 
      () => defaultTemplate, 
      setTemplateNotes, 
      setTemplateNoteValues
    );
  };

  const resetWorkflowToStartStep = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      if (selectedProjectId) {
        await supabase
          .from('project_workflow')
          .update({ 
            workflow_state: 1, 
            last_edited_at: new Date().toISOString()
          })
          .eq('project_id', selectedProjectId)
          .eq('user_id', userData.user.id);
      }
    } catch (error) {
      console.error('Error resetting workflow state:', error);
    }
  };

  const handleExitConfirm = async () => {
    try {
      if (selectedProjectId) {
        await updateWorkflowState(selectedProjectId, 0);
        console.log(`Workflow state reset to 0 for project ${selectedProjectId}`);
      }
      
      setShowExitDialog(false);
      
      if (exitAction) {
        if (exitAction.type === 'mode-change') {
          setReportMode(exitAction.value as 'new' | 'update');
          if (exitAction.value === 'new') {
            resetForm();
            resetTemplateNoteValues();
            
            if (defaultTemplate?.id) {
              fetchDefaultTemplate();
            }
          }
        } else if (exitAction.type === 'project-change') {
          setSelectedProjectId(exitAction.value);
          handleProjectSelect(
            exitAction.value, 
            () => isLoading, 
            () => defaultTemplate, 
            setTemplateNotes, 
            setTemplateNoteValues
          );
        }
      }
    } catch (error) {
      console.error('Error handling exit confirmation:', error);
    }
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
    setExitAction(null);
  };
  
  const handleTemplateChange = async (templateId: string) => {
    if (workflowState === 1 && selectedProjectId) {
      setExitAction({
        type: 'template-change',
        value: templateId
      });
      setShowExitDialog(true);
      return;
    }
    
    await fetchTemplateById(templateId);
  };
  
  const handleSave = () => {
    if (!selectedTemplate && !defaultTemplate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No template available. Please contact your administrator.',
      });
      return;
    }
    
    resetWorkflowToStartStep();
    
    saveReport({
      reportMode,
      reportName: reportName,
      templateId: selectedTemplate?.id || defaultTemplate?.id,
      selectedProjectId: selectedProjectId,
      templateNotes,
      templateNoteValues
    });
  };
  
  const handleCancel = () => {
    resetForm();
    resetTemplateNoteValues();
  };

  const handleStepClick = (step: number) => {
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
      
      <InstructionsPanel stepNumber={1} />
      
      <ReportModeSelector 
        value={reportMode}
        onChange={handleReportModeChange}
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
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
            <TemplateSelector
              selectedTemplateId={selectedTemplate?.id || defaultTemplate?.id || null}
              onTemplateChange={handleTemplateChange}
            />
          </div>
          
          {(reportMode === 'new' || (reportMode === 'update' && selectedProjectId)) && (
            <>
              {templateNotes.length > 0 ? (
                <TemplateNotesColumns
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
          
          <ActionButtons
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            isDisabled={reportMode === 'update' && !selectedProjectId}
          />
        </>
      )}

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
