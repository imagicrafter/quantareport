
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InstructionsPanel from '../start-report/InstructionsPanel';
import ReportModeSelector from '../start-report/ReportModeSelector';
import ReportNameInput from '../start-report/ReportNameInput';
import TemplateDisplay from '../start-report/TemplateDisplay';
import ProjectSelector from '../start-report/ProjectSelector';
import LoadingSpinner from '../start-report/LoadingSpinner';
import TemplateNotesForm from '../TemplateNotesForm';
import { useTemplateData } from '@/hooks/report-workflow/useTemplateData';
import { useProjectData } from '@/hooks/report-workflow/useProjectData';
import { useReportSave } from '@/hooks/report-workflow/useReportSave';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Step1Start = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to get project ID with consistent logic
  const getProjectIdFromState = (): string | null => {
    if (location.state?.projectId) {
      return location.state.projectId;
    }
    return null;
  };
  
  // Capture any project ID from location state (for when we return from other steps)
  const projectIdFromState = getProjectIdFromState();
  
  console.log('Step1Start - Location state:', location.state);
  console.log('Step1Start - Project ID from state:', projectIdFromState);
  console.log('Step1Start - Location pathname:', location.pathname);
  console.log('Step1Start - Location key:', location.key);
  
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
  
  // Effect to update workflow state when component mounts
  useEffect(() => {
    const updateWorkflowState = async () => {
      try {
        // If we have a project ID from state, update its workflow state to 1
        if (projectIdFromState) {
          const user = await supabase.auth.getUser();
          
          if (user.data.user) {
            // Check if workflow entry exists
            const { data: existingWorkflow, error: checkError } = await supabase
              .from('project_workflow')
              .select('id')
              .eq('project_id', projectIdFromState)
              .maybeSingle();
              
            if (checkError) {
              console.error('Error checking workflow existence:', checkError);
            }
              
            if (existingWorkflow) {
              // Update existing workflow state
              const { error: updateError } = await supabase
                .from('project_workflow')
                .update({ workflow_state: 1 })
                .eq('project_id', projectIdFromState);
                
              if (updateError) {
                console.error('Error updating workflow state:', updateError);
              } else {
                console.log('Updated workflow state to 1 for project:', projectIdFromState);
              }
            } else {
              // Create new workflow entry
              const { error: insertError } = await supabase
                .from('project_workflow')
                .insert({
                  project_id: projectIdFromState,
                  user_id: user.data.user.id,
                  workflow_state: 1
                });
                
              if (insertError) {
                console.error('Error creating workflow state:', insertError);
              } else {
                console.log('Created workflow state 1 for project:', projectIdFromState);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error updating workflow state:', error);
      }
    };
    
    updateWorkflowState();
  }, [projectIdFromState]);
  
  // Reset form when report mode changes
  useEffect(() => {
    console.log('Step1Start - Report mode changed to:', reportMode);
    if (reportMode === 'new') {
      // Reset form to initial state
      resetForm();
      resetTemplateNoteValues();
    } else if (reportMode === 'update') {
      // If we're in update mode and have a project ID from state, select it
      if (projectIdFromState) {
        console.log('Step1Start - Setting selected project ID from state:', projectIdFromState);
        setSelectedProjectId(projectIdFromState);
      }
    }
  }, [reportMode]);

  // Handle project ID from step return (coming back from Step 2, etc.)
  useEffect(() => {
    if (projectIdFromState) {
      console.log('Step1Start - Detected project ID in location state:', projectIdFromState);
      
      // If user is coming back to Step 1 with a project ID, switch to update mode
      // and pre-select the project
      if (reportMode === 'new') {
        console.log('Step1Start - Switching to update mode due to project ID in state');
        setReportMode('update');
      }
      
      // Pre-select the project
      setSelectedProjectId(projectIdFromState);
    }
  }, [projectIdFromState]);

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
  
  const handleSave = async () => {
    console.log('Step1Start - Save button clicked');
    
    const success = await saveReport({
      reportMode,
      reportName,
      templateId: defaultTemplate?.id,
      selectedProjectId,
      templateNotes,
      templateNoteValues
    });
    
    console.log('Step1Start - saveReport result:', success);
    // Navigation is now handled inside the saveReport function
  };
  
  const handleCancel = () => {
    resetForm();
    resetTemplateNoteValues();
  };

  const handleProjectSelection = (projectId: string) => {
    console.log('Step1Start - Project selected:', projectId);
    
    handleProjectSelect(
      projectId, 
      (loading: boolean) => isLoading, 
      (template: any) => defaultTemplate, 
      setTemplateNotes, 
      setTemplateNoteValues
    );
  };

  return (
    <div>
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
          <div className="flex justify-between max-w-3xl mx-auto mt-8">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={(reportMode === 'update' && !selectedProjectId) || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="mr-2">Saving</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                'Next: Upload Files'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step1Start;
