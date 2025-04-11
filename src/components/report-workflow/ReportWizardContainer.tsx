
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import StepIndicator from './StepIndicator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const steps = [
  { title: 'Start Report', path: 'start' },
  { title: 'Upload Files', path: 'files' },
  { title: 'Process Files', path: 'process' },
  { title: 'Edit Notes', path: 'notes' },
  { title: 'Generate Report', path: 'generate' },
  { title: 'Review Report', path: 'review' }
];

const ReportWizardContainer = () => {
  const { step } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkflowState, setCurrentWorkflowState] = useState<number | null>(null);
  
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
    return stepIndex >= 0 && stepIndex < steps.length ? stepIndex : 0;
  };
  
  // Get current step index based on the route parameter
  const getStepIndexFromPath = () => {
    if (!step) return 0;
    const index = steps.findIndex(s => s.path === step);
    return index >= 0 ? index : 0;
  };
  
  const handleStepClick = async (index: number) => {
    console.log('handleStepClick - Trying to navigate to index:', index);
    
    // If navigating to step 1 (index 0), we'll allow it without any checks
    // This enables users to restart the workflow
    if (index === 0) {
      console.log('Navigating to step 1 to restart workflow');
      navigate(`/dashboard/report-wizard/${steps[0].path}`);
      return;
    }
    
    // Check if we're trying to navigate forward but don't have a project ID
    // Only block navigation to steps after "start" if we don't have a project ID
    if (index > 0) {
      // If we don't have current state/project, try to fetch it
      if (!currentWorkflowState || !projectId) {
        const { workflowState, projectId: activeProjectId } = await fetchCurrentWorkflow();
        setCurrentWorkflowState(workflowState);
        setProjectId(activeProjectId);
        
        // If we still don't have an active workflow or project ID
        if (!workflowState || !activeProjectId) {
          toast({
            description: "Please complete the first step before proceeding.",
            variant: "destructive"
          });
          navigate(`/dashboard/report-wizard/${steps[0].path}`);
          return;
        }
      }
      
      // Check if user is trying to skip ahead
      if (index > currentWorkflowState!) {
        toast({
          description: "Please complete the current step before proceeding.",
        });
        // Navigate to the step matching their current workflow state
        navigate(`/dashboard/report-wizard/${steps[currentWorkflowState! - 1].path}`);
        return;
      }
    }
    
    // Allow navigation to previous steps or the first step
    navigate(`/dashboard/report-wizard/${steps[index].path}`);
  };
  
  // Handle navigation and determine the correct step based on workflow state
  useEffect(() => {
    const initializeWorkflow = async () => {
      setIsLoading(true);
      
      // Fetch the current workflow state
      const { workflowState, projectId: activeProjectId } = await fetchCurrentWorkflow();
      setCurrentWorkflowState(workflowState);
      setProjectId(activeProjectId);
      
      // If we have an active workflow state but no route parameter,
      // redirect to the appropriate step
      if (!step) {
        if (workflowState) {
          const stepIndex = getStepIndexFromWorkflowState(workflowState);
          console.log(`No step specified, redirecting to step ${stepIndex + 1} based on workflow state ${workflowState}`);
          navigate(`/dashboard/report-wizard/${steps[stepIndex].path}`, { replace: true });
        } else {
          console.log('No workflow state found, starting at step 1');
          navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
        }
        setIsLoading(false);
        return;
      }
      
      // Get the step index from the URL path
      const pathStepIndex = getStepIndexFromPath();
      
      // Special case: if user is navigating to Step 1, allow it always
      // This enables users to restart the workflow
      if (pathStepIndex === 0) {
        console.log('User accessing Step 1, allowing access to restart workflow');
        setIsLoading(false);
        return;
      }
      
      // If we're beyond step 1, verify we have a valid workflow state and project ID
      if (pathStepIndex > 0) {
        if (!workflowState || !activeProjectId) {
          console.log('Trying to access a step beyond start but no active workflow found');
          toast({
            description: "Please start a new report first.",
            variant: "destructive"
          });
          navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
          setIsLoading(false);
          return;
        }
        
        // If trying to access a step ahead of their workflow state
        if (pathStepIndex + 1 > workflowState) {
          console.log(`Trying to access step ${pathStepIndex + 1} but workflow state is ${workflowState}`);
          toast({
            description: "Please complete the previous steps first.",
            variant: "destructive"
          });
          navigate(`/dashboard/report-wizard/${steps[workflowState - 1].path}`, { replace: true });
          setIsLoading(false);
          return;
        }
      }
      
      setIsLoading(false);
    };
    
    initializeWorkflow();
  }, [step, navigate]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Create New Report
      </h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator 
          currentStep={currentWorkflowState || 1}
          totalSteps={steps.length}
          onStepClick={(step) => handleStepClick(step - 1)}
          steps={steps}
        />
      </div>
      
      {/* Step Content - rendered via Outlet */}
      <Outlet />
    </div>
  );
};

export default ReportWizardContainer;
