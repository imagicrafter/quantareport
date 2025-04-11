
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { toast } = useToast();
  
  // Get current step number based on the route parameter
  const getCurrentStepIndex = () => {
    if (!step) return 0;
    const index = steps.findIndex(s => s.path === step);
    return index >= 0 ? index : 0;
  };
  
  const currentStepIndex = getCurrentStepIndex();
  
  // Get the project ID from state or query params
  const getProjectId = () => {
    // First try to get from location state
    if (location.state?.projectId) {
      return location.state.projectId;
    }
    
    // Then try to get from URL query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const projectIdFromQuery = searchParams.get('projectId');
    if (projectIdFromQuery) {
      return projectIdFromQuery;
    }
    
    return null;
  };
  
  const projectId = getProjectId();
  
  // ENHANCED LOGGING: Log more details including full location object
  console.log('ReportWizardContainer render:', {
    currentStep: step,
    currentStepIndex,
    locationState: location.state,
    locationPathname: location.pathname,
    locationKey: location.key,
    projectIdFromFunction: projectId,
    queryParams: window.location.search
  });
  
  // Function to fetch the most recent workflow for a specific step
  const fetchActiveWorkflowForStep = async (stepIndex) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      const { data, error } = await supabase
        .from('project_workflow')
        .select('project_id')
        .eq('user_id', userData.user.id)
        .eq('workflow_state', stepIndex + 1)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error(`Error fetching workflow for step ${stepIndex + 1}:`, error);
        return null;
      }
      
      return data?.project_id || null;
    } catch (e) {
      console.error('Error in fetchActiveWorkflowForStep:', e);
      return null;
    }
  };
  
  const handleStepClick = async (index: number) => {
    // Get the project ID from multiple sources
    const projectId = getProjectId();
    
    console.log('handleStepClick - Project ID:', projectId);
    console.log('handleStepClick - Trying to navigate to index:', index);
    
    // Check if we're trying to navigate forward but don't have a project ID
    // Only block navigation to steps after "start" if we don't have a project ID
    if (index > 0 && !projectId) {
      // Check if user has an active workflow for the requested step
      const activeProjectId = await fetchActiveWorkflowForStep(index);
      
      if (activeProjectId) {
        console.log(`Found active workflow for step ${index + 1} with project ID:`, activeProjectId);
        navigate(`/dashboard/report-wizard/${steps[index].path}`, { 
          state: { projectId: activeProjectId },
          replace: true
        });
        return;
      }
      
      toast({
        description: "Please complete the first step before proceeding.",
        variant: "destructive"
      });
      navigate(`/dashboard/report-wizard/${steps[0].path}`);
      return;
    }
    
    // Check if we're trying to navigate forward beyond the current step
    // This prevents skipping steps
    if (index > currentStepIndex) {
      toast({
        description: "Please complete the current step before proceeding.",
      });
      return;
    }
    
    // Otherwise, allow navigation to previous steps
    // Preserve any state when navigating between steps
    console.log('Navigation approved to step:', steps[index].path);
    navigate(`/dashboard/report-wizard/${steps[index].path}`, { 
      state: { projectId },
      replace: true
    });
  };
  
  // Initialize the wizard at the first step if no step is specified
  useEffect(() => {
    console.log('Step effect triggered. Current step:', step);
    console.log('Current location state:', location.state);
    console.log('Query parameters:', window.location.search);
    
    if (!step) {
      console.log('No step specified, navigating to first step');
      navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
      return;
    }
    
    // Check if we're beyond step 1 but don't have a project ID
    if (currentStepIndex > 0) {
      const projectId = getProjectId();
      
      console.log('Current step index:', currentStepIndex);
      console.log('Project ID from getProjectId():', projectId);
      
      if (!projectId) {
        // Try to get the active workflow from the database for the current step
        const checkForActiveWorkflow = async () => {
          const activeProjectId = await fetchActiveWorkflowForStep(currentStepIndex);
          
          if (activeProjectId) {
            console.log(`Found active workflow for step ${currentStepIndex + 1}:`, activeProjectId);
            // Re-navigate to the same step but with the project ID in state
            navigate(`/dashboard/report-wizard/${step}`, {
              state: { projectId: activeProjectId },
              replace: true
            });
            return;
          }
          
          console.log('No project ID or active workflow found, redirecting to step 1');
          toast({
            description: "Please start a new report first.",
            variant: "destructive"
          });
          navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
        };
        
        checkForActiveWorkflow();
      } else {
        console.log('Project ID found, staying on current step:', step);
        
        // If we have a project ID but it's not in location state,
        // update the location state to include it
        if (!location.state?.projectId) {
          console.log('Project ID not in location state, updating location state');
          navigate(`/dashboard/report-wizard/${step}`, {
            state: { projectId },
            replace: true
          });
        }
      }
    }
  }, [step, navigate, currentStepIndex, location.pathname]);
  
  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Create New Report
      </h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator 
          currentStep={currentStepIndex + 1}
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
