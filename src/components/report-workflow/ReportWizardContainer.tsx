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
  
  // Get the project ID from state
  const getProjectId = () => {
    // Try to get from location state
    return location.state?.projectId || null;
  };
  
  const projectId = getProjectId();
  
  // ENHANCED LOGGING: Log more details including full location object
  console.log('ReportWizardContainer render:', {
    currentStep: step,
    currentStepIndex,
    locationState: location.state,
    locationPathname: location.pathname,
    locationKey: location.key,
    projectIdFromFunction: projectId
  });
  
  const handleStepClick = async (index: number) => {
    // Get the project ID from state
    const projectId = getProjectId();
    
    console.log('handleStepClick - Project ID:', projectId);
    console.log('handleStepClick - Trying to navigate to index:', index);
    
    // Check if we're trying to navigate forward but don't have a project ID
    // Only block navigation to steps after "start" if we don't have a project ID
    if (index > 0 && !projectId) {
      // Check if user has an active workflow
      try {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          // Get the most recent workflow for the current step
          const { data, error } = await supabase
            .from('project_workflow')
            .select('project_id')
            .eq('user_id', user.data.user.id)
            .order('last_edited_at', { ascending: false })
            .limit(1)
            .single();
            
          if (!error && data) {
            navigate(`/dashboard/report-wizard/${steps[index].path}`, { 
              state: { projectId: data.project_id },
              replace: true
            });
            return;
          }
        }
      } catch (e) {
        console.error('Error checking for active workflow:', e);
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
        // Try to get the active workflow from the database
        const checkForActiveWorkflow = async () => {
          try {
            const user = await supabase.auth.getUser();
            if (user.data.user) {
              // Find the most recent workflow state for this step
              const { data, error } = await supabase
                .from('project_workflow')
                .select('project_id')
                .eq('user_id', user.data.user.id)
                .eq('workflow_state', currentStepIndex + 1)
                .order('last_edited_at', { ascending: false })
                .limit(1)
                .single();
                
              if (!error && data) {
                console.log('Found active workflow for current step:', data.project_id);
                navigate(`/dashboard/report-wizard/${step}`, {
                  state: { projectId: data.project_id },
                  replace: true
                });
                return;
              }
            }
            
            console.log('No project ID or active workflow found, redirecting to step 1');
            toast({
              description: "Please start a new report first.",
              variant: "destructive"
            });
            navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
          } catch (e) {
            console.error('Error checking for active workflow:', e);
            navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
          }
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
