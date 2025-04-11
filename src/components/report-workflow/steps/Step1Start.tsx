
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [projectIdFromWorkflow, setProjectIdFromWorkflow] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Function to get active workflow project ID
  const fetchActiveWorkflow = async () => {
    try {
      console.log('Step1Start - Fetching active workflow');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.error('Step1Start - No authenticated user found');
        return null;
      }
      
      // Get the most recent workflow for step 1
      const { data, error } = await supabase
        .from('project_workflow')
        .select('project_id')
        .eq('user_id', userData.user.id)
        .eq('workflow_state', 1)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Step1Start - Error fetching workflow:', error);
        return null;
      }
      
      console.log('Step1Start - Active workflow project ID:', data?.project_id);
      return data?.project_id || null;
    } catch (error) {
      console.error('Step1Start - Error in fetchActiveWorkflow:', error);
      return null;
    }
  };
  
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
  
  // Reset workflow state to 1 when user navigates to this page
  const resetWorkflowToStartStep = async () => {
    try {
      console.log('Step1Start - Resetting workflow to step 1');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.error('Step1Start - No authenticated user found');
        return;
      }
      
      // Update the workflow state for all user projects to 1 (start step)
      // This allows for starting over from step 1
      if (reportMode === 'new') {
        console.log('Step1Start - Creating fresh workflow state for new report');
        // Don't do anything for new reports - let the save button create a new workflow
      } else if (selectedProjectId) {
        console.log('Step1Start - Updating existing workflow state for project:', selectedProjectId);
        
        // Check if workflow record exists
        const { data: existingWorkflow } = await supabase
          .from('project_workflow')
          .select('id')
          .eq('project_id', selectedProjectId)
          .eq('user_id', userData.user.id)
          .maybeSingle();
          
        if (existingWorkflow) {
          // Update existing workflow record
          const { error: updateError } = await supabase
            .from('project_workflow')
            .update({ 
              workflow_state: 1,
              last_edited_at: new Date().toISOString()
            })
            .eq('project_id', selectedProjectId)
            .eq('user_id', userData.user.id);
            
          if (updateError) {
            console.error('Error updating workflow state:', updateError);
          } else {
            console.log('Successfully updated workflow state to 1');
          }
        } else {
          // Create new workflow record
          const { error: insertError } = await supabase
            .from('project_workflow')
            .insert({
              project_id: selectedProjectId,
              user_id: userData.user.id,
              workflow_state: 1,
              last_edited_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating workflow state:', insertError);
          } else {
            console.log('Successfully created workflow state with state 1');
          }
        }
      }
    } catch (error) {
      console.error('Step1Start - Error in resetWorkflowToStartStep:', error);
    }
  };
  
  // Effect to fetch project ID from workflow when component mounts
  useEffect(() => {
    const getActiveWorkflow = async () => {
      const projectId = await fetchActiveWorkflow();
      if (projectId) {
        console.log('Step1Start - Found active workflow project ID:', projectId);
        setProjectIdFromWorkflow(projectId);
        
        // If we have an active workflow, switch to update mode and select the project
        if (reportMode === 'new') {
          console.log('Step1Start - Switching to update mode due to active workflow');
          setReportMode('update');
        }
        
        // Pre-select the project
        setSelectedProjectId(projectId);
        
        // Update workflow state to 1 (start step)
        resetWorkflowToStartStep();
      }
    };
    
    getActiveWorkflow();
    
    // Reset workflow to step 1 whenever we land on this page
    resetWorkflowToStartStep();
  }, []);
  
  // Reset form when report mode changes
  useEffect(() => {
    console.log('Step1Start - Report mode changed to:', reportMode);
    if (reportMode === 'new') {
      // Reset form to initial state
      resetForm();
      resetTemplateNoteValues();
    } else if (reportMode === 'update') {
      // If we're in update mode and have a project ID from workflow, select it
      if (projectIdFromWorkflow) {
        console.log('Step1Start - Setting selected project ID from workflow:', projectIdFromWorkflow);
        setSelectedProjectId(projectIdFromWorkflow);
      }
    }
  }, [reportMode]);

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
    // Navigation is handled inside the saveReport function
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
