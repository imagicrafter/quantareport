import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { workflowSteps } from '@/components/report-workflow/constants/workflowSteps';

export const useWorkflowNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitTarget, setExitTarget] = useState('');
  
  // Function to update workflow state
  const updateWorkflowState = async (projectId: string | null, newState: number) => {
    if (!projectId) return false;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      
      console.log(`Updating workflow state to ${newState} for project ${projectId}`);
      
      const { error } = await supabase
        .from('project_workflow')
        .update({ 
          workflow_state: newState,
          last_edited_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('user_id', userData.user.id);
        
      if (error) {
        console.error('Error updating workflow state:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Error in updateWorkflowState:', e);
      return false;
    }
  };
  
  // Function to fetch the most recent workflow for a specific workflow state
  const fetchActiveWorkflowForState = async (workflowState: number) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      console.log(`Fetching active workflow for state ${workflowState}`);
      
      const { data, error } = await supabase
        .from('project_workflow')
        .select('project_id')
        .eq('user_id', userData.user.id)
        .eq('workflow_state', workflowState)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error(`Error fetching workflow for state ${workflowState}:`, error);
        return null;
      }
      
      console.log(`Result for workflow state ${workflowState}:`, data);
      return data?.project_id || null;
    } catch (e) {
      console.error('Error in fetchActiveWorkflowForState:', e);
      return null;
    }
  };
  
  // Function to get the current active workflow state and project_id
  const fetchCurrentWorkflow = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { workflowState: null, projectId: null };
      
      // Get the most recent workflow record for the user
      const { data, error } = await supabase
        .from('project_workflow')
        .select('workflow_state, project_id')
        .eq('user_id', userData.user.id)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching current workflow:', error);
        return { workflowState: null, projectId: null };
      }
      
      if (data) {
        console.log('Current workflow state from DB:', data.workflow_state);
        console.log('Current project ID from DB:', data.project_id);
        
        return { 
          workflowState: data.workflow_state, 
          projectId: data.project_id 
        };
      }
      
      return { workflowState: null, projectId: null };
    } catch (e) {
      console.error('Error in fetchCurrentWorkflow:', e);
      return { workflowState: null, projectId: null };
    }
  };
  
  // Function to determine the current step index from workflow_state
  const getStepIndexFromWorkflowState = (workflowState: number | null) => {
    if (!workflowState) return 0;
    // workflow_state is 1-based, but our step array is 0-based
    const stepIndex = workflowState - 1;
    return stepIndex >= 0 && stepIndex < workflowSteps.length ? stepIndex : 0;
  };
  
  // Get current step index based on the route parameter
  const getStepIndexFromPath = (step: string | undefined) => {
    if (!step) return 0;
    const index = workflowSteps.findIndex(s => s.path === step);
    return index >= 0 ? index : 0;
  };
  
  // Enhanced handleStepClick to update workflow state when navigating between steps
  const handleStepClick = async (index: number, currentWorkflowState: number | null, projectId: string | null) => {
    console.log('handleStepClick - Trying to navigate to index:', index);
    
    // Special handling for Step 1 (index 0)
    if (index === 0 && currentWorkflowState && currentWorkflowState > 1 && projectId) {
      // If clicking on Step 1 from any other step, show exit dialog instead of direct navigation
      setExitTarget('/dashboard/report-wizard/start');
      setShowExitDialog(true);
      return;
    }
    
    // Don't allow navigating to future steps that haven't been reached yet
    if (currentWorkflowState && index + 1 > currentWorkflowState) {
      console.log(`Cannot skip ahead to step ${index + 1} from workflow state ${currentWorkflowState}`);
      toast({
        description: "Please complete the current step before proceeding.",
      });
      return;
    }
    
    // If navigating to any previous step and we have a project ID, update the workflow state
    if (projectId && currentWorkflowState && index + 1 <= currentWorkflowState) {
      console.log(`Navigating to step ${index + 1}, updating workflow state from ${currentWorkflowState}`);
      
      // Update the workflow state to match the selected step
      await updateWorkflowState(projectId, index + 1);
      
      // Navigate to the selected step
      navigate(`/dashboard/report-wizard/${workflowSteps[index].path}`);
      return;
    }
    
    // If navigating to step 1 (index 0), we'll allow it without any checks
    // This enables users to restart the workflow
    if (index === 0) {
      console.log('Navigating to step 1 to restart workflow');
      navigate(`/dashboard/report-wizard/${workflowSteps[0].path}`);
      return;
    }
    
    // Check if we're trying to navigate forward but don't have a project ID
    // Only block navigation to steps after "start" if we don't have a project ID
    if (index > 0) {
      // If we don't have current state/project, try to fetch it
      if (!currentWorkflowState || !projectId) {
        const { workflowState, projectId: activeProjectId } = await fetchCurrentWorkflow();
        
        // If we still don't have an active workflow or project ID
        if (!workflowState || !activeProjectId) {
          toast({
            description: "Please complete the first step before proceeding.",
            variant: "destructive"
          });
          navigate(`/dashboard/report-wizard/${workflowSteps[0].path}`);
          return;
        }
        
        // Update the current workflow state with what we fetched
        currentWorkflowState = workflowState;
      }
      
      // Check if user is trying to skip ahead
      if (index > currentWorkflowState!) {
        toast({
          description: "Please complete the current step before proceeding.",
        });
        // Navigate to the step matching their current workflow state
        navigate(`/dashboard/report-wizard/${workflowSteps[currentWorkflowState! - 1].path}`);
        return;
      }
    }
    
    // Allow navigation to previous steps or the first step
    navigate(`/dashboard/report-wizard/${workflowSteps[index].path}`);
  };
  
  // Custom navigation hook to intercept navigation events
  const handleNavigation = useCallback((to: string, projectId: string | null, projectName: string) => {
    // Don't show exit dialog for navigation within the wizard
    if (to.includes('/dashboard/report-wizard/')) {
      navigate(to);
      return;
    }
    
    // If clicking on wizard menu item link, navigate directly without confirmation
    if (to === '/dashboard/report-wizard' || to === '/dashboard/report-wizard/') {
      navigate('/dashboard/report-wizard/start');
      return;
    }
    
    // For other links, show the exit confirmation dialog
    setExitTarget(to);
    setShowExitDialog(true);
  }, [navigate]);

  return {
    fetchActiveWorkflowForState,
    fetchCurrentWorkflow,
    getStepIndexFromWorkflowState,
    getStepIndexFromPath,
    handleStepClick,
    handleNavigation,
    showExitDialog,
    setShowExitDialog,
    exitTarget,
    setExitTarget,
    updateWorkflowState
  };
};
