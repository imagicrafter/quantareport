
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

const Step1Start = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const [workflowState, setWorkflowState] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { fetchCurrentWorkflow } = useWorkflowNavigation();
  
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
  
  // Check if we're coming back from step 2 with workflow state = 1
  useEffect(() => {
    const checkWorkflowState = async () => {
      try {
        const { workflowState, projectId } = await fetchCurrentWorkflow();
        setWorkflowState(workflowState);
        
        // If we're in workflow state 1 and have a projectId, preselect the existing project
        if (workflowState === 1 && projectId) {
          console.log('Coming back to Step 1 with workflow state 1, preselecting project:', projectId);
          setReportMode('update');
          setSelectedProjectId(projectId);
          
          // Fetch project details for the selected project
          handleProjectSelect(
            projectId, 
            (loading: boolean) => isLoading, 
            (template: any) => defaultTemplate, 
            setTemplateNotes, 
            setTemplateNoteValues
          );
        }
      } catch (error) {
        console.error('Error checking workflow state:', error);
      }
    };
    
    checkWorkflowState();
  }, [fetchCurrentWorkflow, setSelectedProjectId]);
  
  // Reset form when report mode changes - but only if not preselected from workflow
  useEffect(() => {
    if (reportMode === 'new' && !workflowState) {
      // Reset form to initial state
      resetForm();
      resetTemplateNoteValues();
    }
  }, [reportMode, workflowState]);

  // Separate useEffect for fetching template
  useEffect(() => {
    if (reportMode === 'new' && defaultTemplate?.id) {
      fetchDefaultTemplate();
    }
  }, [reportMode, defaultTemplate?.id]);
  
  const handleReportModeChange = (mode: 'new' | 'update') => {
    setReportMode(mode);
    // The form reset is handled in the useEffect
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

  const handleProjectSelection = (projectId: string) => {
    handleProjectSelect(
      projectId, 
      (loading: boolean) => isLoading, 
      (template: any) => defaultTemplate, 
      setTemplateNotes, 
      setTemplateNoteValues
    );
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
                  onSelect={handleProjectSelection}
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
    </div>
  );
};

export default Step1Start;
