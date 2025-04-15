import { useState, useEffect, useRef } from 'react';
import { useParams, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
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
  
  const getCurrentStepIndex = () => {
    if (!step) return 0;
    return workflowSteps.findIndex(s => s.path === step);
  };
  
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
  
  useEffect(() => {
    if (initializationComplete.current) return;
    
    const initializeWorkflow = async () => {
      setIsLoading(true);
      
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
      
      const pathStepIndex = getStepIndexFromPath(step);
      
      if (pathStepIndex === 0) {
        console.log('User accessing Step 1, allowing access to restart workflow');
        setIsLoading(false);
        initializationComplete.current = true;
        return;
      }
      
      if (pathStepIndex > 0) {
        if (!workflowState || !activeProjectId) {
          console.log('Trying to access a step beyond start but no active workflow found');
          handleNavigation(`/dashboard/report-wizard/${workflowSteps[0].path}`, activeProjectId, projectName);
          setIsLoading(false);
          initializationComplete.current = true;
          return;
        }
        
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
  
  useEffect(() => {
    const updateCurrentWorkflowState = async () => {
      if (step) {
        const pathStepIndex = getStepIndexFromPath(step);
        setCurrentWorkflowState(pathStepIndex + 1);
      }
    };
    
    if (initializationComplete.current) {
      updateCurrentWorkflowState();
    }
  }, [location.pathname, step, getStepIndexFromPath]);
  
  useEffect(() => {
    return () => {
      if (step) {
        initializationComplete.current = false;
      }
    };
  }, [step]);
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href === '#') {
          return;
        }
        
        if (anchor.classList.contains('next-step-button')) {
          return;
        }
        
        if (currentWorkflowState === 6) {
          e.preventDefault();
          toast("Please use the Finish button at the bottom of the page to complete your report.", {
            style: { backgroundColor: 'hsl(var(--destructive))' }
          });
          return;
        }
        
        if (href.includes('/dashboard/report-wizard/files')) {
          console.log('Clicking on step 2 banner from step 3, allowing navigation');
          return;
        }
        
        if (href.includes('/dashboard/report-wizard/')) {
          return;
        }
        
        if (href === '/dashboard/report-wizard' || href === '/dashboard/report-wizard/') {
          handleNavigation('/dashboard/report-wizard/start', projectId, projectName);
          e.preventDefault();
          return;
        }
        
        if (projectId && currentWorkflowState && currentWorkflowState > 0) {
          e.preventDefault();
          setShowExitDialog(true);
          setExitTarget(href);
          console.log(`Exit dialog triggered for: ${href}`);
        }
      }
    };
    
    document.addEventListener('click', handleClick, true);
    
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
      
      <div className="mb-8">
        <StepIndicator 
          currentStep={currentWorkflowState || 1}
          totalSteps={workflowSteps.length}
          onStepClick={(step) => handleStepClick(step - 1, currentWorkflowState, projectId)}
          steps={workflowSteps}
        />
      </div>
      
      <Outlet />
      
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
