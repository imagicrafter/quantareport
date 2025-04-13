import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Play } from 'lucide-react';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import ReportGenerationProgress from '@/components/reports/ReportGenerationProgress';
import { useReportGeneration } from '@/hooks/reports/useReportGeneration';
import { navigateToReportEditor, generateReport } from '@/components/reports/services/ReportGenerationService';
import StepNavigationButtons from './components/StepNavigationButtons';

const Step5Generate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { updateWorkflowState, fetchCurrentWorkflow } = useWorkflowNavigation();
  const [existingReport, setExistingReport] = useState<{ id: string, status: string, content?: string } | null>(null);
  const [isStaleReport, setIsStaleReport] = useState(false);
  
  // Use the report generation hook for consistent functionality
  const {
    creatingReport,
    generationInProgress,
    reportCreated,
    progressUpdate,
    handleCreateReport,
    navigateToReport
  } = useReportGeneration();
  
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
        
        // Check if a report already exists for this project
        const { data: existingReports, error: reportsError } = await supabase
          .from('reports')
          .select('id, content, status')
          .eq('project_id', currentProjectId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (reportsError) {
          console.error('Error checking for existing reports:', reportsError);
        }
        
        // If we have an existing report, set it to display its status
        if (existingReports && existingReports.length > 0) {
          console.log('Found existing report:', existingReports[0]);
          const latestReport = existingReports[0];
          
          // Set existing report
          setExistingReport(latestReport);
          
          // Check if report is in processing status
          if (latestReport.status === 'processing') {
            await checkReportProgressStatus(latestReport.id);
          }
        }
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
  
  const checkReportProgressStatus = async (reportId: string) => {
    try {
      // Get the latest progress update for this report
      const { data: progressData, error: progressError } = await supabase
        .from('report_progress')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (progressError) {
        console.error('Error fetching report progress:', progressError);
        return;
      }

      if (!progressData || progressData.length === 0) {
        console.log('No progress data found for report:', reportId);
        setIsStaleReport(true);
        return;
      }

      const latestProgress = progressData[0];
      console.log('Latest progress data:', latestProgress);

      // Check if the latest update is more than 15 minutes old
      const latestUpdateTime = new Date(latestProgress.created_at);
      const currentTime = new Date();
      const timeDifferenceMinutes = (currentTime.getTime() - latestUpdateTime.getTime()) / (1000 * 60);

      if (timeDifferenceMinutes > 15 && latestProgress.status !== 'completed') {
        console.log('Report progress is stale (over 15 minutes old)');
        setIsStaleReport(true);
        
        // Archive the stale report
        await supabase
          .from('reports')
          .update({ status: 'archived' })
          .eq('id', reportId);
        
        toast({
          title: "Stale Report Detected",
          description: "Previous report generation timed out. Starting a new report.",
        });
      } else {
        // Use the latest progress update
        if (latestProgress) {
          const progressUpdateData = {
            report_id: latestProgress.report_id,
            status: latestProgress.status as 'idle' | 'generating' | 'completed' | 'error',
            message: latestProgress.message,
            progress: latestProgress.progress,
            created_at: latestProgress.created_at,
            job: latestProgress.job
          };
          
          // Use the report generation hook to update progress
          setReportCreated({
            id: reportId,
            content: existingReport?.content || ''
          });
        }
      }
    } catch (error) {
      console.error('Error checking report progress status:', error);
    }
  };
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/notes');
  };
  
  const handleNext = async () => {
    if (reportCreated?.id && projectId) {
      try {
        // Update workflow state to 6
        await updateWorkflowState(projectId, 6);
        await navigateToReportEditor(reportCreated.id, navigate);
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
  
  const handleGenerateReport = async () => {
    if (!projectId) return;
    
    // Prevent duplicate generations
    if (generationInProgress[projectId]) {
      toast({
        title: "Already in Progress",
        description: "Report generation is already in progress. Please wait.",
      });
      return;
    }
    
    // Check if we have a stale report that was marked for archiving
    if (isStaleReport && existingReport) {
      console.log('Using archived report, generating a new one');
      await handleCreateReport(projectId);
      return;
    }
    
    // Check if we already have a completed report
    if (existingReport?.status === 'processing') {
      // This report is already being processed
      // We've already checked if it's stale in the useEffect
      toast({
        title: "Report Processing",
        description: "A report is already being processed. Please wait for it to complete.",
      });
      return;
    }
    
    // If we have a completed report, ask if they want to regenerate
    if (existingReport?.status !== 'draft' && existingReport?.content) {
      toast({
        title: "Using Existing Report",
        description: "Your report has already been generated. Proceeding to review.",
      });
      
      // Go to the next step with the existing report
      setReportCreated({
        id: existingReport.id,
        content: existingReport.content
      });
      await handleNext();
      return;
    }
    
    // Otherwise, generate a new report
    console.log('Starting new report generation for project:', projectId);
    await handleCreateReport(projectId);
  };
  
  // Determine component status based on report generation state
  const getStatus = () => {
    if (progressUpdate) return progressUpdate.status;
    
    // If we have a valid existing report that's not stale or draft, show it as completed
    if (existingReport?.status === 'completed' || 
       (existingReport?.status !== 'draft' && 
        existingReport?.content && 
        !isStaleReport)) {
      return 'completed';
    }
    
    return 'idle';
  };
  
  const getMessage = () => {
    if (progressUpdate) return progressUpdate.message;
    if (isStaleReport) return 'Previous report timed out. Click Generate Report to start a new one.';
    if (existingReport?.status === 'completed') return 'Report generated successfully.';
    return 'Click the Generate Report button to start.';
  };
  
  const getProgress = () => {
    if (progressUpdate) return progressUpdate.progress;
    if (existingReport?.status === 'completed') return 100;
    return 0;
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={5} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center py-6">
              {getStatus() === 'generating' ? (
                <FileText className="h-16 w-16 text-primary mb-4 animate-pulse" />
              ) : getStatus() === 'completed' ? (
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              ) : (
                <FileText className="h-16 w-16 text-primary mb-4" />
              )}
              
              <h3 className="text-lg font-medium mb-4">
                {getStatus() === 'generating' ? 'Generating Report' : 
                 getStatus() === 'completed' ? 'Report Generated' : 
                 getStatus() === 'error' ? 'Error Generating Report' : 'Generate Your Report'}
              </h3>
              
              <div className="w-full max-w-md mb-6">
                <ReportGenerationProgress 
                  progress={getProgress()} 
                  message={getMessage()}
                  status={getStatus() as 'idle' | 'generating' | 'completed' | 'error'}
                />
              </div>
              
              {getStatus() === 'idle' && (
                <Button 
                  className="w-full max-w-md flex items-center justify-center"
                  onClick={handleGenerateReport}
                  disabled={!projectId || generationInProgress[projectId || '']}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              )}
              
              {getStatus() === 'completed' && (reportCreated || existingReport) && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Report Details:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Report generated successfully</li>
                      <li>Images included: {(reportCreated?.content || existingReport?.content || "").match(/<img/g)?.length || 0}</li>
                      <li>Generated on {new Date().toLocaleDateString()}</li>
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleNext}
                  >
                    Preview Report
                  </Button>
                </div>
              )}
              
              {getStatus() === 'error' && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                    <h4 className="font-medium mb-2">Error Details:</h4>
                    <p className="text-sm">{getMessage()}</p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => projectId && handleCreateReport(projectId)}
                    disabled={!projectId || generationInProgress[projectId || '']}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack} disabled={getStatus() === 'generating'}>
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
