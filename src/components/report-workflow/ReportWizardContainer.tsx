
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
  
  const handleStepClick = (index: number) => {
    // Get the project ID from state or localStorage
    const projectId = location.state?.projectId || localStorage.getItem('currentProjectId');
    
    // Check if we're trying to navigate forward but don't have a project ID
    if (index > 0 && !projectId) {
      toast({
        description: "Please complete the first step before proceeding.",
        variant: "destructive"
      });
      navigate(`/dashboard/report-wizard/${steps[0].path}`);
      return;
    }
    
    // Check if we're trying to navigate forward beyond the current step
    if (index > currentStepIndex) {
      toast({
        description: "Please complete the current step before proceeding.",
      });
      return;
    }
    
    // Otherwise, allow navigation to previous steps
    // Preserve any state when navigating between steps
    navigate(`/dashboard/report-wizard/${steps[index].path}`, { 
      state: { projectId: projectId } 
    });
  };
  
  // Initialize the wizard at the first step if no step is specified
  useEffect(() => {
    if (!step) {
      navigate(`/dashboard/report-wizard/${steps[0].path}`);
      return;
    }
    
    // Check if we're beyond step 1 but don't have a project ID
    if (currentStepIndex > 0) {
      const projectId = location.state?.projectId || localStorage.getItem('currentProjectId');
      
      console.log('Current step index:', currentStepIndex);
      console.log('Project ID from state or localStorage:', projectId);
      
      if (!projectId) {
        toast({
          description: "Please start a new report first.",
          variant: "destructive"
        });
        navigate(`/dashboard/report-wizard/${steps[0].path}`);
      }
    }
  }, [step, navigate, currentStepIndex, location.state]);
  
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
