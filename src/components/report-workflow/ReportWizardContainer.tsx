
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
  
  // Get current step number based on the route parameter
  const getCurrentStepIndex = () => {
    if (!step) return 0;
    const index = steps.findIndex(s => s.path === step);
    return index >= 0 ? index : 0;
  };
  
  const currentStepIndex = getCurrentStepIndex();
  
  // Function to fetch the most recent workflow for a specific step
  const fetchActiveWorkflowForStep = async (stepIndex: number) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      console.log(`Fetching active workflow for step ${stepIndex + 1}`);
      
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
      
      console.log(`Result for step ${stepIndex + 1}:`, data);
      return data?.project_id || null;
    } catch (e) {
      console.error('Error in fetchActiveWorkflowForStep:', e);
      return null;
    }
  };
  
  const handleStepClick = async (index: number) => {
    console.log('handleStepClick - Trying to navigate to index:', index);
    
    // Check if we're trying to navigate forward but don't have a project ID
    // Only block navigation to steps after "start" if we don't have a project ID
    if (index > 0) {
      // Check if user has an active workflow for the requested step
      const activeProjectId = await fetchActiveWorkflowForStep(index);
      
      if (activeProjectId) {
        console.log(`Found active workflow for step ${index + 1} with project ID:`, activeProjectId);
        setProjectId(activeProjectId);
        navigate(`/dashboard/report-wizard/${steps[index].path}`);
        return;
      }
      
      if (index > currentStepIndex) {
        toast({
          description: "Please complete the current step before proceeding.",
        });
        return;
      }
      
      if (index !== 0 && !activeProjectId) {
        toast({
          description: "Please complete the first step before proceeding.",
          variant: "destructive"
        });
        navigate(`/dashboard/report-wizard/${steps[0].path}`);
        return;
      }
    }
    
    // Allow navigation to previous steps or the first step
    navigate(`/dashboard/report-wizard/${steps[index].path}`);
  };
  
  // Initialize the wizard at the first step if no step is specified
  // or load the appropriate project ID for the current step
  useEffect(() => {
    if (!step) {
      console.log('No step specified, navigating to first step');
      navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
      return;
    }
    
    // Check if we're beyond step 1
    if (currentStepIndex > 0) {
      console.log(`On step ${currentStepIndex + 1} (${step}), fetching project data from database`);
      
      // Try to get the active workflow from the database for the current step
      const checkForActiveWorkflow = async () => {
        const activeProjectId = await fetchActiveWorkflowForStep(currentStepIndex);
        
        if (activeProjectId) {
          console.log(`Found active workflow for step ${currentStepIndex + 1}:`, activeProjectId);
          setProjectId(activeProjectId);
        } else {
          console.log('No active workflow found, redirecting to step 1');
          toast({
            description: "Please start a new report first.",
            variant: "destructive"
          });
          navigate(`/dashboard/report-wizard/${steps[0].path}`, { replace: true });
        }
      };
      
      checkForActiveWorkflow();
    }
  }, [step, navigate, currentStepIndex]);
  
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
