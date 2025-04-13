
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle } from 'lucide-react';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { getWebhookUrl, getCurrentEnvironment, isDevelopmentEnvironment } from '@/utils/webhookConfig';
import { fetchReportById, createReport, ReportStatus, updateReport } from '@/components/reports/ReportService';
import ReportGenerationProgress from '@/components/reports/ReportGenerationProgress';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';

const Step5Generate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Preparing report generation...');
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [reportCreated, setReportCreated] = useState<{ id: string, content: string } | null>(null);
  const { updateWorkflowState, fetchCurrentWorkflow } = useWorkflowNavigation();
  const [generationInitiated, setGenerationInitiated] = useState(false);
  
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
        
        if (existingReports && existingReports.length > 0) {
          console.log('Found existing report:', existingReports[0]);
          const latestReport = existingReports[0];
          
          // Check if report is already complete or in-progress
          if (latestReport.status === 'processing') {
            console.log('Report is already being processed. Using existing report.');
            setReportCreated({
              id: latestReport.id,
              content: latestReport.content || ''
            });
            setStatus('generating');
            setProgress(15);
            setMessage('Report generation in progress...');
            return;
          } else if (latestReport.status !== 'draft' && latestReport.content) {
            console.log('Report is already completed. Using existing report.');
            setReportCreated({
              id: latestReport.id,
              content: latestReport.content
            });
            setStatus('completed');
            setProgress(100);
            setMessage('Report has already been generated.');
            return;
          }
        }
        
        // If no existing valid report, start report generation (but only once)
        if (!generationInitiated) {
          console.log('No valid existing report found. Starting new report generation.');
          setGenerationInitiated(true);
          startGeneration(currentProjectId);
        }
      } catch (error) {
        console.error('Error initializing Step5Generate:', error);
        setStatus('error');
        setMessage('Failed to initialize report generation. Please try again.');
      }
    };
    
    initializeComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    let subscription: any = null;
    let contentCheckInterval: number | null = null;
    
    const setupSubscription = async () => {
      if (!reportCreated?.id) return;
      
      console.log(`Setting up subscription for report progress updates on report ${reportCreated.id}`);
      
      try {
        const { data: initialStatus, error: initialStatusError } = await supabase
          .from('report_progress')
          .select('*')
          .eq('report_id', reportCreated.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!initialStatusError && initialStatus && initialStatus.length > 0) {
          console.log('Initial status found:', initialStatus[0]);
          const update = initialStatus[0];
          
          setProgress(update.progress || 0);
          setMessage(update.message || 'Processing your report...');
          setStatus(update.status as any || 'generating');
          
          if (update.status === 'completed' || update.progress >= 100) {
            console.log('Report already completed');
            setStatus('completed');
            setProgress(100);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking initial status:', err);
      }
      
      const channelName = `report-progress-${reportCreated.id}-${Date.now()}`;
      console.log(`Creating channel with name: ${channelName}`);
      
      subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'report_progress',
            filter: `report_id=eq.${reportCreated.id}`
          },
          (payload) => {
            const update = payload.new as any;
            console.log('Received progress update:', update);
            
            setProgress(update.progress || 0);
            setMessage(update.message || 'Processing your report...');
            setStatus(update.status as any || 'generating');
            
            if (update.status === 'completed' || update.progress >= 100) {
              setStatus('completed');
              setProgress(100);
              console.log('Report completed');
            }
          }
        )
        .subscribe((status) => {
          console.log(`Channel ${channelName} subscription status:`, status);
        });
        
      console.log('Subscription set up successfully');
      
      contentCheckInterval = window.setInterval(() => {
        checkReportContent();
      }, 5000);
    };
    
    if (reportCreated?.id) {
      setupSubscription();
    }
    
    return () => {
      console.log('Cleaning up subscriptions and intervals');
      if (subscription) {
        console.log('Removing channel:', subscription.topic);
        supabase.removeChannel(subscription);
      }
      if (contentCheckInterval) {
        window.clearInterval(contentCheckInterval);
      }
    };
  }, [reportCreated]);
  
  const checkReportContent = async () => {
    if (!reportCreated?.id) return;
    
    try {
      console.log(`Checking if report ${reportCreated.id} content has been updated...`);
      const report = await fetchReportById(reportCreated.id);
      
      if (report.content && report.content !== reportCreated.content) {
        console.log('Report content has been updated');
        setReportCreated({
          id: report.id,
          content: report.content
        });
        setStatus('completed');
        setProgress(100);
      }
    } catch (error) {
      console.error('Error checking report content:', error);
    }
  };
  
  const startGeneration = async (projectId: string) => {
    try {
      // Check if we already have started generation to prevent duplicate calls
      if (status === 'generating') {
        console.log('Report generation already in progress, skipping duplicate start');
        return;
      }
      
      // Check for existing reports to prevent duplicates
      const { data: existingReports, error: reportsError } = await supabase
        .from('reports')
        .select('id, content, status')
        .eq('project_id', projectId)
        .eq('status', 'processing')
        .limit(1);
        
      if (reportsError) {
        console.error('Error checking for existing processing reports:', reportsError);
      }
      
      if (existingReports && existingReports.length > 0) {
        console.log('Found existing processing report:', existingReports[0]);
        setReportCreated({
          id: existingReports[0].id,
          content: existingReports[0].content || ''
        });
        setStatus('generating');
        setProgress(15);
        setMessage('Report generation in progress...');
        return;
      }
      
      setStatus('generating');
      setProgress(5);
      setMessage('Starting report generation...');
      
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
        toast({
          title: "Authentication Required",
          description: "Please sign in to generate a report.",
          variant: "destructive"
        });
        setStatus('error');
        setMessage('Authentication required. Please sign in.');
        return;
      }
      
      const userId = session.session.user.id;
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) {
        console.error('Error fetching project:', projectError);
        setStatus('error');
        setMessage('Failed to load project details.');
        return;
      }
      
      const { data: images, error: imagesError } = await supabase
        .from('files')
        .select('file_path')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('type', 'image');
        
      if (imagesError) {
        console.error('Error fetching images:', imagesError);
        setStatus('error');
        setMessage('Failed to load project images.');
        return;
      }
      
      const imageUrls = images ? images.map(img => img.file_path) : [];
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const initialContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="text-align: center; color: #2563eb; margin-bottom: 20px;">${project.name} - Project Report</h1>
          <p style="text-align: center; font-style: italic; margin-bottom: 30px;">Generated on ${currentDate}</p>
          <p>This is an automatically generated report for the ${project.name} project.</p>
        </div>
      `;
      
      const isTestReport = project.name.toLowerCase().includes('test');
      const shouldUseTestMode = isDevelopmentEnvironment() && isTestReport;
      
      const reportTitle = shouldUseTestMode 
        ? `##TESTING## ${project.name} Report` 
        : `${project.name} Report`;
      
      const reportData = {
        title: reportTitle,
        content: initialContent,
        project_id: projectId,
        user_id: userId,
        status: 'processing' as ReportStatus,
        image_urls: imageUrls,
        template_id: project.template_id || null
      };
      
      console.log('Creating report with data:', reportData);
      const newReport = await createReport(reportData);
      console.log('Report created:', newReport);
      
      setReportCreated({
        id: newReport.id,
        content: newReport.content
      });
      
      setProgress(10);
      setMessage('Report created. Starting content generation...');
      
      const jobUuid = uuidv4();
      console.log(`Generated job UUID: ${jobUuid}`);
      
      const { error: progressError } = await supabase
        .from('report_progress')
        .insert({
          report_id: newReport.id,
          status: 'generating',
          message: 'Starting report generation...',
          progress: 10,
          job: jobUuid
        });
        
      if (progressError) {
        console.error('Error creating initial progress record:', progressError);
      }
      
      toast({
        title: "Report Creation Started",
        description: "Your report is being generated..."
      });
      
      const environment = getCurrentEnvironment();
      console.log(`Current app environment: ${environment}, Test mode: ${shouldUseTestMode}`);
      
      const reportWebhookUrl = getWebhookUrl('report', environment, shouldUseTestMode);
      
      console.log(`Using webhook URL: ${reportWebhookUrl} (Test mode: ${shouldUseTestMode}, Environment: ${environment})`);
      
      const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL || "https://vtaufnxworztolfdwlll.supabase.co";
      const callbackUrl = `${supabaseProjectUrl}/functions/v1/report-progress/${newReport.id}`;
      
      console.log(`Using Supabase edge function callback URL: ${callbackUrl}`);
      
      const webhookPayload = {
        project_id: projectId,
        report_id: newReport.id,
        user_id: userId,
        project_name: project.name,
        timestamp: new Date().toISOString(),
        image_count: imageUrls.length,
        image_urls: imageUrls,
        template_id: project.template_id,
        action: 'generate_report',
        callback_url: callbackUrl,
        job: jobUuid,
        is_test: shouldUseTestMode
      };
      
      console.log('Webhook payload:', webhookPayload);
      
      try {
        console.log(`Sending webhook to: ${reportWebhookUrl}`);
        
        const postResponse = await fetch(reportWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          mode: 'cors',
          body: JSON.stringify(webhookPayload)
        });
        
        if (postResponse.ok) {
          console.log(`Webhook POST request to ${reportWebhookUrl} succeeded:`, await postResponse.text());
          setProgress(15);
          setMessage('Report generation in progress...');
        } else {
          console.error(`Webhook POST response error for ${reportWebhookUrl}:`, await postResponse.text());
          
          // Fallback to GET request
          const getUrl = new URL(reportWebhookUrl);
          Object.entries(webhookPayload).forEach(([key, value]) => {
            getUrl.searchParams.append(key, String(value));
          });
          
          const getResponse = await fetch(getUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Origin': window.location.origin
            },
            mode: 'cors'
          });
          
          if (getResponse.ok) {
            console.log(`Webhook GET request to ${reportWebhookUrl} succeeded:`, await getResponse.text());
            setProgress(15);
            setMessage('Report generation in progress...');
          } else {
            console.error(`Webhook GET response error for ${reportWebhookUrl}:`, await getResponse.text());
            throw new Error(`Failed to send webhook request to ${reportWebhookUrl}`);
          }
        }
      } catch (error) {
        console.error(`Error sending webhook to ${reportWebhookUrl}:`, error);
        setStatus('error');
        setMessage('Failed to start report generation. Please try again.');
        toast({
          title: "Error",
          description: "Failed to start report generation. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating report:', error);
      setStatus('error');
      setMessage('Failed to create report. Please try again.');
      toast({
        title: "Error", 
        description: "Failed to create report. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/notes');
  };
  
  const handleNext = async () => {
    if (reportCreated?.id && projectId) {
      try {
        // Update report status if it's still processing
        const report = await fetchReportById(reportCreated.id);
        if (report.status === 'processing') {
          await updateReport(report.id, { status: 'draft' });
        }
        
        // Update workflow state to 6
        await updateWorkflowState(projectId, 6);
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
        description: "Please wait for the report to be generated before proceeding.",
      });
    }
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={5} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center py-6">
              {status === 'generating' ? (
                <FileText className="h-16 w-16 text-primary mb-4 animate-pulse" />
              ) : status === 'completed' ? (
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              ) : (
                <FileText className="h-16 w-16 text-primary mb-4" />
              )}
              
              <h3 className="text-lg font-medium mb-4">
                {status === 'generating' ? 'Generating Report' : 
                 status === 'completed' ? 'Report Generated' : 
                 status === 'error' ? 'Error Generating Report' : 'Preparing Report'}
              </h3>
              
              <div className="w-full max-w-md mb-6">
                <ReportGenerationProgress 
                  progress={progress} 
                  message={message}
                  status={status}
                />
              </div>
              
              {status === 'completed' && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Report Details:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Report generated successfully</li>
                      <li>Images included: {reportCreated?.content?.match(/<img/g)?.length || 0}</li>
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
              
              {status === 'error' && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                    <h4 className="font-medium mb-2">Error Details:</h4>
                    <p className="text-sm">{message}</p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => startGeneration(projectId!)}
                    disabled={!projectId}
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
        <Button variant="outline" onClick={handleBack} disabled={status === 'generating'}>
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={status !== 'completed'}
        >
          Next: Review Report
        </Button>
      </div>
    </div>
  );
};

export default Step5Generate;
