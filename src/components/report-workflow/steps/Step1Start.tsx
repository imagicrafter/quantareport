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
  
  const fetchActiveWorkflow = async () => {
    try {
      console.log('Step1Start - Fetching active workflow');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.error('Step1Start - No authenticated user found');
        return null;
      }
      
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
  
  const resetWorkflowToStartStep = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: currentWorkflow } = await supabase
        .from('project_workflow')
        .select('id, project_id, workflow_state')
        .eq('user_id', userData.user.id)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (currentWorkflow && currentWorkflow.workflow_state > 1) {
        console.log('Resetting workflow state to 1 for restart');
        
        await supabase
          .from('project_workflow')
          .update({ 
            workflow_state: 1,
            last_edited_at: new Date().toISOString()
          })
          .eq('id', currentWorkflow.id);
      }
    } catch (error) {
      console.error('Error resetting workflow state:', error);
    }
  };
  
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
  
  useEffect(() => {
    const getActiveWorkflow = async () => {
      const projectId = await fetchActiveWorkflow();
      if (projectId) {
        console.log('Step1Start - Found active workflow project ID:', projectId);
        setProjectIdFromWorkflow(projectId);
        
        if (reportMode === 'new') {
          console.log('Step1Start - Switching to update mode due to active workflow');
          setReportMode('update');
        }
        
        setSelectedProjectId(projectId);
        
        resetWorkflowToStartStep();
      }
    };
    
    getActiveWorkflow();
    
    resetWorkflowToStartStep();
  }, []);
  
  useEffect(() => {
    const resetWorkflowStateToOne = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        const { data: currentWorkflow } = await supabase
          .from('project_workflow')
          .select('id, project_id, workflow_state')
          .eq('user_id', userData.user.id)
          .order('last_edited_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (currentWorkflow && currentWorkflow.workflow_state > 1) {
          console.log('Resetting workflow state to 1 for restart');
          
          await supabase
            .from('project_workflow')
            .update({ 
              workflow_state: 1,
              last_edited_at: new Date().toISOString()
            })
            .eq('id', currentWorkflow.id);
        }
      } catch (error) {
        console.error('Error resetting workflow state:', error);
      }
    };
    
    resetWorkflowStateToOne();
  }, []);
  
  useEffect(() => {
    console.log('Step1Start - Report mode changed to:', reportMode);
    if (reportMode === 'new') {
      resetForm();
      resetTemplateNoteValues();
    } else if (reportMode === 'update') {
      if (projectIdFromWorkflow) {
        setSelectedProjectId(projectIdFromWorkflow);
      }
    }
  }, [reportMode]);

  useEffect(() => {
    if (reportMode === 'new' && defaultTemplate?.id) {
      fetchDefaultTemplate();
    }
  }, [reportMode, defaultTemplate?.id]);
  
  const handleReportModeChange = (mode: 'new' | 'update') => {
    setReportMode(mode);
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
                  onSelect={handleProjectSelection}
                />
              )}
            </div>
            <TemplateDisplay templateName={defaultTemplate?.name} />
          </div>
          
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
