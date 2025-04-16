
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
import useReportGeneration from '@/hooks/reports/useReportGeneration';
import { navigateToReportEditor, generateReport } from '@/components/reports/services/ReportGenerationService';
import StepNavigationButtons from './components/StepNavigationButtons';

const Step5Generate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { updateWorkflowState, fetchCurrentWorkflow } = useWorkflowNavigation();
  const [existingReport, setExistingReport] = useState<{ id: string, status: string, content?: string } | null>(null);
  const [isStaleReport, setIsStaleReport] = useState(false);
  
  const {
    creatingReport,
    generationInProgress,
    reportCreated,
    setReportCreated,
    progressUpdate,
    setProgressUpdate,
    handleCreateReport,
    navigateToReport
  } = useReportGeneration();
  
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const { projectId: currentProjectId } = await fetchCurrentWorkflow();
        
        if (!currentProjectId) {
          toast({
            description: "No active project found. Please start a new report.",
          });
          navigate('/dashboard/report-wizard/start');
          return;
        }
        
        setProjectId(currentProjectId);
        
        await updateWorkflowState(currentProjectId, 5);
        
        const { data: existingReports, error: reportsError } = await supabase
          .from('reports')
          .select('id, content, status')
          .eq('project_id', currentProjectId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (reportsError) {
          console.error('Error checking for existing reports:', reportsError);
        }
        
        if (existingReports && existingReports.length > 0) {
          console.log('Found existing report:', existingReports[0]);
          const latestReport = existingReports[0];
          
          setExistingReport(latestReport);
          
          if (latestReport.status === 'completed') {
            setReportCreated({
              id: latestReport.id,
              content: latestReport.content || ''
            });
            setProgressUpdate({
              report_id: latestReport.id,
              status: 'completed',
              message: 'Report is ready for review.',
              progress: 100,
              created_at: new Date().toISOString(),
              job: ''
            });
          } else if (latestReport.status === 'processing') {
            await checkReportProgressStatus(latestReport.id);
          }
        }
      } catch (error) {
        console.error('Error initializing Step5Generate:', error);
        toast({
          description: "Failed to initialize report generation. Please try again.",
        });
      }
    };
    
    initializeComponent();
  }, []);
  
  const checkReportProgressStatus = async (reportId: string) => {
    try {
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

      const latestUpdateTime = new Date(latestProgress.created_at);
      const currentTime = new Date();
      const timeDifferenceMinutes = (currentTime.getTime() - latestUpdateTime.getTime()) / (1000 * 60);

      if (timeDifferenceMinutes > 15 && latestProgress.status !== 'completed') {
        console.log('Report progress is stale (over 15 minutes old)');
        setIsStaleReport(true);
        
        await supabase
          .from('reports')
          .update({ status: 'archived' })
          .eq('id', reportId);
        
        toast({
          title: "Stale Report Detected",
          description: "Previous report generation timed out. Starting a new report.",
        });
      } else {
        if (latestProgress) {
          const progressUpdateData = {
            report_id: latestProgress.report_id,
            status: latestProgress.status as 'idle' | 'generating' | 'completed' | 'error',
            message: latestProgress.message,
            progress: latestProgress.progress,
            created_at: latestProgress.created_at,
            job: latestProgress.job
          };
          
          if (setReportCreated) {
            setReportCreated({
              id: reportId,
              content: existingReport?.content || ''
            });
          }
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
    if ((reportCreated?.id || existingReport?.id) && projectId) {
      try {
        const reportIdToUse = reportCreated?.id || existingReport?.id;
        
        await updateWorkflowState(projectId, 6);
        navigate('/dashboard/report-wizard/review');
      } catch (error) {
        console.error('Error navigating to next step:', error);
        toast({
          description: "Failed to proceed to the next step. Please try again.",
        });
      }
    } else {
      toast({
        description: "Please generate the report before proceeding.",
      });
    }
  };
  
  const handleGenerateReport = async () => {
    if (!projectId) return;
    
    if (generationInProgress[projectId]) {
      toast({
        title: "Already in Progress",
        description: "Report generation is already in progress. Please wait.",
      });
      return;
    }
    
    if (isStaleReport && existingReport) {
      console.log('Using archived report, generating a new one');
      await handleCreateReport(projectId);
      return;
    }
    
    if (existingReport?.status === 'processing') {
      toast({
        title: "Report Processing",
        description: "A report is already being processed. Please wait for it to complete.",
      });
      return;
    }
    
    if (existingReport?.status !== 'draft' && existingReport?.content) {
      toast({
        title: "Using Existing Report",
        description: "Your report has already been generated. Proceeding to review.",
      });
      
      if (setReportCreated) {
        setReportCreated({
          id: existingReport.id,
          content: existingReport.content
        });
      }
      await handleNext();
      return;
    }
    
    console.log('Starting new report generation for project:', projectId);
    await handleCreateReport(projectId);
  };
  
  const getStatus = () => {
    if (progressUpdate) return progressUpdate.status;
    
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
                      <li>Report {existingReport?.status === 'completed' ? 'is ready' : 'generated successfully'}</li>
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
