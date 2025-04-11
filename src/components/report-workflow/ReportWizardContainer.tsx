
import { useState, useEffect, useRef } from 'react';
import { useParams, Outlet, useLocation } from 'react-router-dom';
import StepIndicator from './StepIndicator';
import { workflowSteps } from './constants/workflowSteps';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { useProjectDetails } from '@/hooks/report-workflow/useProjectDetails';
import ExitWorkflowDialog from './ExitWorkflowDialog';
import WorkflowLoading from './WorkflowLoading';

const ReportWizardContainer = () => {
  const { step } = useParams();
  const location = useLocation();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkflowState, setCurrentWorkflowState] = useState<number | null>(null);
  const initializationComplete = useRef(false);
  
  const {
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
  } = useWorkflowNavigation();
  
  const { projectName, getPageTitle } = useProjectDetails(projectId);
  
  // Handle navigation and determine the correct step based on workflow state
  useEffect(() => {
    // Prevent multiple initializations
    if (initializationComplete.current) return;
    
    const initializeWorkflow = async () => {
      setIsLoading(true);
      
      // Fetch the current workflow state
      const { workflowState, projectId: activeProjectId } = await fetchCurrentWorkflow();
      setCurrentWorkflowState(workflowState);
      setProjectId(activeProjectId);
      
      if (!step) {
        if (workflowState) {
          const stepIndex = getStepIndexFromWorkflowState(workflowState);
          console.log(`No step specified, redirecting to step ${stepIndex + 1} based on workflow state ${workflowState}`);
          handleNavigation(`/dashboard/report-wizard/${workflowSteps[stepIndex].path}`, activeProjectId, projectName);
        } else {
          console.log('No workflow state found, starting at step 1');
          handleNavigation(`/dashboard/report-wizard/${workflowSteps[0].path}`, activeProjectId, projectName);
        }
        setIsLoading(false);
        initializationComplete.current = true;
        return;
      }
      
      // Get the step index from the URL path
      const pathStepIndex = getStepIndexFromPath(step);
      
      // Special case: if user is navigating to Step 1, allow it always
      // This enables users to restart the workflow
      if (pathStepIndex === 0) {
        console.log('User accessing Step 1, allowing access to restart workflow');
        setIsLoading(false);
        initializationComplete.current = true;
        return;
      }
      
      // Validate navigation for steps beyond step 1
      if (pathStepIndex > 0) {
        if (!workflowState || !activeProjectId) {
          console.log('Trying to access a step beyond start but no active workflow found');
          handleNavigation(`/dashboard/report-wizard/${workflowSteps[0].path}`, activeProjectId, projectName);
          setIsLoading(false);
          initializationComplete.current = true;
          return;
        }
        
        // If trying to access a step ahead of their workflow state
        if (pathStepIndex + 1 > workflowState) {
          console.log(`Trying to access step ${pathStepIndex + 1} but workflow state is ${workflowState}`);
          handleNavigation(`/dashboard/report-wizard/${workflowSteps[workflowState - 1].path}`, activeProjectId, projectName);
          setIsLoading(false);
          initializationComplete.current = true;
          return;
        }
      }
      
      setIsLoading(false);
      initializationComplete.current = true;
    };
    
    initializeWorkflow();
  }, [step, handleNavigation, fetchCurrentWorkflow, getStepIndexFromWorkflowState, getStepIndexFromPath, projectName]);
  
  // Reset the initialization flag when the step changes
  useEffect(() => {
    return () => {
      // Only reset when navigating to a new step
      if (step) {
        initializationComplete.current = false;
      }
    };
  }, [step]);
  
  // Add event listeners to intercept link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Check if the click is on an anchor element or its child
      let target = e.target as HTMLElement;
      
      // Find the closest anchor element
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        
        // Skip if it's an external link or doesn't have href
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href === '#') {
          return;
        }
        
        // Skip for next step buttons within the workflow
        if (anchor.classList.contains('next-step-button')) {
          return;
        }
        
        // Skip for links within the workflow
        if (href.includes('/dashboard/report-wizard/')) {
          return;
        }
        
        // Skip specifically for the Wizard menu item
        if (href === '/dashboard/report-wizard' || href === '/dashboard/report-wizard/') {
          handleNavigation('/dashboard/report-wizard/start', projectId, projectName);
          e.preventDefault();
          return;
        }
        
        // For any other internal link, show confirmation if we have a project
        if (projectId && currentWorkflowState && currentWorkflowState > 0) {
          e.preventDefault();
          setShowExitDialog(true);
          setExitTarget(href);
          console.log(`Exit dialog triggered for: ${href}`);
        }
      }
    };
    
    // Add the event listener to the document
    document.addEventListener('click', handleClick, true); // Use capturing phase
    
    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [handleNavigation, projectId, currentWorkflowState, projectName, setShowExitDialog, setExitTarget]);
  
  if (isLoading) {
    return <WorkflowLoading />;
  }
  
  const currentStepIndex = getStepIndexFromPath(step);
  
  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {getPageTitle(currentStepIndex)}
      </h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator 
          currentStep={currentWorkflowState || 1}
          totalSteps={workflowSteps.length}
          onStepClick={(step) => handleStepClick(step - 1, currentWorkflowState, projectId)}
          steps={workflowSteps}
        />
      </div>
      
      {/* Step Content - rendered via Outlet */}
      <Outlet />
      
      {/* Exit Workflow Confirmation Dialog */}
      <ExitWorkflowDialog
        isOpen={showExitDialog}
        setIsOpen={setShowExitDialog}
        projectId={projectId}
        projectName={projectName}
        targetPath={exitTarget}
      />
    </div>
  );
};

export default ReportWizardContainer;
