
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
import StepIndicator from './StepIndicator';
import { useToast } from '@/components/ui/use-toast';

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
  
  // Get the project ID from state or localStorage
  const getProjectId = () => {
    // First try to get from location state
    const projectIdFromState = location.state?.projectId;
    if (projectIdFromState) {
      return projectIdFromState;
    }
    
    // If not found in state, try localStorage
    return localStorage.getItem('currentProjectId');
  };
  
  const projectId = getProjectId();
  
  // ENHANCED LOGGING: Log more details including full location object
  console.log('ReportWizardContainer render:', {
    currentStep: step,
    currentStepIndex,
    locationState: location.state,
    locationPathname: location.pathname,
    locationKey: location.key,
    storedProjectId: localStorage.getItem('currentProjectId'),
    projectIdFromFunction: projectId
  });
  
  const handleStepClick = (index: number) => {
    // Get the project ID from state or localStorage
    const projectId = getProjectId();
    
    console.log('handleStepClick - Project ID:', projectId);
    console.log('handleStepClick - Trying to navigate to index:', index);
    
    // Check if we're trying to navigate forward but don't have a project ID
    // Only block navigation to steps after "start" if we don't have a project ID
    if (index > 0 && !projectId) {
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
    console.log('Local storage project ID:', localStorage.getItem('currentProjectId'));
    
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
        console.log('No project ID found, redirecting to step 1');
        toast({
          description: "Please start a new report first.",
          variant: "destructive"
        });
        navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
      } else {
        console.log('Project ID found, staying on current step:', step);
        
        // IMPORTANT FIX: If we have a project ID but it's not in location state,
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
