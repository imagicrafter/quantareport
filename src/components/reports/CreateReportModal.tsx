import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createReport, ReportStatus, fetchReportById, updateReport } from './ReportService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import ReportGenerationProgress from './ReportGenerationProgress';
import { v4 as uuidv4 } from 'uuid';
import { getWebhookUrl, getCurrentEnvironment, isDevelopmentEnvironment } from '@/utils/webhookConfig'; 

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  image_count: number;
  notes_count: number;
  has_report: boolean;
  template_id: string | null;
  last_update?: string;
}

interface ProgressUpdate {
  report_id: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
  progress: number;
  created_at: string;
}

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateReportModal = ({ isOpen, onClose }: CreateReportModalProps) => {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingReport, setCreatingReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportCreated, setReportCreated] = useState<{id: string, content: string} | null>(null);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
  const navigate = useNavigate();
  const [generationInProgress, setGenerationInProgress] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

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
          const update = initialStatus[0] as ProgressUpdate;
          setProgressUpdate(update);
          
          if (update.status === 'completed' || update.progress >= 100) {
            console.log('Report already completed, navigating to editor...');
            navigateToReport();
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
            const update = payload.new as ProgressUpdate;
            console.log('Received progress update:', update);
            setProgressUpdate(update);
            
            if (update.status === 'completed' || update.progress >= 100) {
              console.log('Report completed, navigating to editor...');
              navigateToReport();
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
  
  const navigateToReport = async () => {
    if (!reportCreated?.id) return;
    
    try {
      console.log(`Report ${reportCreated.id} completed, navigating to editor...`);
      const report = await fetchReportById(reportCreated.id);
      
      if (report.status === 'processing') {
        await updateReport(report.id, { status: 'draft' });
      }
      
      setReportCreated(null);
      setProgressUpdate(null);
      onClose();
      
      navigate(`/dashboard/reports/editor/${report.id}`);
    } catch (error) {
      console.error('Error navigating to report:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };
  
  const checkReportContent = async () => {
    if (!reportCreated?.id) return;
    
    try {
      console.log(`Checking if report ${reportCreated.id} content has been updated...`);
      const report = await fetchReportById(reportCreated.id);
      
      if (report.content && report.content !== reportCreated.content) {
        console.log('Report content has been updated, navigating to editor...');
        navigateToReport();
      }
    } catch (error) {
      console.error('Error checking report content:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
        setError('Authentication required. Please sign in.');
        return;
      }

      try {
        const { data: projectsWithLastUpdate, error: joinError } = await supabase
          .from('projects')
          .select(`
            id, 
            name, 
            description, 
            template_id
          `)
          .eq('user_id', session.session.user.id);

        if (!joinError && projectsWithLastUpdate) {
          console.log('Successfully fetched projects:', projectsWithLastUpdate);
          
          const projectsWithUpdateTime = await Promise.all(projectsWithLastUpdate.map(async (project) => {
            const { data: updateData, error: updateError } = await supabase
              .from('v_projects_last_update')
              .select('last_update')
              .eq('project_id', project.id)
              .single();
              
            return {
              ...project,
              last_update: updateError ? null : (updateData?.last_update || null)
            };
          }));

          const sortedProjects = projectsWithUpdateTime.sort((a, b) => {
            if (!a.last_update) return 1;
            if (!b.last_update) return -1;
            return new Date(b.last_update).getTime() - new Date(a.last_update).getTime();
          });

          await processProjects(sortedProjects);
          return;
        }
      } catch (sortError) {
        console.error('Error sorting projects by last_update:', sortError);
        // Fall back to regular project fetching without sorting
      }

      console.log('Falling back to regular project fetching');
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description, template_id')
        .eq('user_id', session.session.user.id);

      if (projectsError) throw projectsError;

      await processProjects(projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processProjects = async (projectsData: any[]) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
        setError('Authentication required. Please sign in.');
        return;
      }
      
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('project_id')
        .eq('user_id', session.session.user.id);

      if (reportsError) throw reportsError;

      const projectsWithReports = new Set(reports?.map(report => report.project_id) || []);

      const projectDetails = await Promise.all(projectsData.map(async (project) => {
        const { count: imageCount, error: imageError } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('type', 'image');

        if (imageError) {
          console.error('Error fetching image count:', imageError);
        }

        const { count: notesCount, error: notesError } = await supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id);

        if (notesError) {
          console.error('Error fetching notes count:', notesError);
        }

        return {
          ...project,
          image_count: imageCount || 0,
          notes_count: notesCount || 0,
          has_report: projectsWithReports.has(project.id)
        };
      }));

      setProjects(projectDetails);
    } catch (error) {
      console.error('Error processing projects:', error);
      throw error;
    }
  };

  const handleCreateReport = async (projectId: string) => {
    try {
      if (generationInProgress[projectId]) {
        console.log(`Report generation already in progress for project ${projectId}, skipping duplicate request`);
        return;
      }
      
      setGenerationInProgress(prev => ({...prev, [projectId]: true}));
      setCreatingReport(projectId);
      
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
        toast.error('Authentication required. Please sign in.');
        return;
      }
      
      const userId = session.session.user.id;
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      const { data: images, error: imagesError } = await supabase
        .from('files')
        .select('file_path')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('type', 'image');
        
      if (imagesError) throw imagesError;
      
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
      
      const jobUuid = uuidv4();
      console.log(`Generated job UUID: ${jobUuid}`);
      
      const { error: progressError } = await supabase
        .from('report_progress')
        .insert({
          report_id: newReport.id,
          status: 'generating',
          message: 'Starting report generation...',
          progress: 5,
          job: jobUuid
        });
        
      if (progressError) {
        console.error('Error creating initial progress record:', progressError);
      }
      
      toast.success('Report created. Generating content...');
      
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
        } else {
          console.error(`Webhook POST response error for ${reportWebhookUrl}:`, await postResponse.text());
          
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
          } else {
            console.error(`Webhook GET response error for ${reportWebhookUrl}:`, await getResponse.text());
            throw new Error(`Failed to send webhook request to ${reportWebhookUrl}`);
          }
        }
      } catch (error) {
        console.error(`Error sending webhook to ${reportWebhookUrl}:`, error);
        toast.error('Failed to start report generation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report. Please try again.');
      setCreatingReport(null);
      setGenerationInProgress(prev => {
        const updated = {...prev};
        delete updated[projectId];
        return updated;
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Report</DialogTitle>
            <DialogDescription>
              Select a project to create a new report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {reportCreated && progressUpdate && (
              <div className="mb-6 p-4 border rounded-md">
                <h3 className="text-md font-semibold mb-3">Report Generation Status</h3>
                <ReportGenerationProgress
                  status={progressUpdate.status}
                  progress={progressUpdate.progress}
                  message={progressUpdate.message}
                />
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="h-40 animate-pulse">
                    <CardHeader className="bg-gray-200 h-full rounded-md"></CardHeader>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center p-4 border rounded-md bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || 'No description'}
                        {project.has_report && (
                          <span className="ml-2 text-amber-600 font-medium">(Has existing report)</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      <p>{project.image_count} {project.image_count === 1 ? 'Image' : 'Images'}</p>
                      <p>{project.notes_count} {project.notes_count === 1 ? 'Note' : 'Notes'}</p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleCreateReport(project.id)}
                        disabled={creatingReport !== null || reportCreated !== null}
                        className="w-full"
                      >
                        {creatingReport === project.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Report...
                          </>
                        ) : project.has_report ? (
                          'Create New Report'
                        ) : (
                          'Create Report'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-md">
                <p className="text-muted-foreground">
                  No projects available. Create a project first to generate a report.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateReportModal;
