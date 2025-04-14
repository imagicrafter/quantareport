
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { useToast } from '@/components/ui/use-toast';
import ReportStatus from './generate-report/ReportStatus';
import { useReportStatus } from './generate-report/useReportStatus';
import StepNavigationButtons from './components/StepNavigationButtons';

const Step5Generate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { updateWorkflowState, fetchCurrentWorkflow } = useWorkflowNavigation();
  
  // Use the custom hook to manage report status
  const {
    reportCreated,
    generationInProgress,
    handleGenerateReport,
    navigateToReport,
    getStatus,
    getMessage,
    getProgress
  } = useReportStatus(projectId);
  
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Get current workflow state and project ID
        const { projectId: currentProjectId } = await fetchCurrentWorkflow();
        
        if (!currentProjectId) {
          toast({
            title: "Error",
            description: "No active project found. Please start a new report.",
            variant: "destructive"
          });
          navigate('/dashboard/report-wizard/start');
          return;
        }
        
        setProjectId(currentProjectId);
        
        // Update workflow state to 5
        await updateWorkflowState(currentProjectId, 5);
      } catch (error) {
        console.error('Error initializing Step5Generate:', error);
        toast({
          title: "Error",
          description: "Failed to initialize report generation. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    initializeComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/notes');
  };
  
  const handleNext = async () => {
    if (reportCreated?.id && projectId) {
      try {
        // Update workflow state to 6
        await updateWorkflowState(projectId, 6);
        await navigateToReport();
        navigate('/dashboard/report-wizard/review');
      } catch (error) {
        console.error('Error navigating to next step:', error);
        toast({
          title: "Error",
          description: "Failed to proceed to the next step. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Report Not Ready",
        description: "Please generate the report before proceeding.",
      });
    }
  };
  
  const onGenerateReport = async () => {
    const reportId = await handleGenerateReport();
    if (reportId) {
      await handleNext();
    }
  };
  
  const onTryAgain = async () => {
    if (projectId) {
      await handleGenerateReport();
    }
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={5} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <ReportStatus
          status={getStatus()}
          message={getMessage()}
          progress={getProgress()}
          onGenerateReport={onGenerateReport}
          onPreviewReport={handleNext}
          onTryAgain={onTryAgain}
          projectId={projectId}
          isGenerating={generationInProgress[projectId || '']}
          reportContent={reportCreated?.content}
        />
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          disabled={getStatus() === 'generating'}
        >
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={getStatus() !== 'completed'}
        >
          Next: Review Report
        </Button>
      </div>
    </div>
  );
};

export default Step5Generate;
