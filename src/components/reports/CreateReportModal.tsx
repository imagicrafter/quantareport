import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createReport, ReportStatus, fetchReportById } from './ReportService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import ReportGenerationProgress from './ReportGenerationProgress';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  image_count: number;
  notes_count: number;
  has_report: boolean;
  template_id: string | null;
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
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    let subscription: any = null;
    let contentCheckInterval: number | null = null;
    let errorCheckInterval: number | null = null;
    
    const setupSubscription = async () => {
      if (!reportCreated?.id) return;
      
      console.log(`Setting up subscription for report progress updates on report ${reportCreated.id}`);
      
      // Get initial status to handle cases where events might have been missed
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
          
          // If there's already an error status, show error dialog immediately
          if (update.status === 'error') {
            console.log('Error status found in initial check, showing error dialog');
            setShowErrorDialog(true);
            return;
          }
          
          // If report is already complete, navigate to it
          if (update.status === 'completed' || update.progress >= 100) {
            console.log('Report already completed, navigating to editor...');
            navigateToReport();
            return;
          }
        }
      } catch (err) {
        console.error('Error checking initial status:', err);
      }
      
      // Create a unique channel name with timestamp to avoid conflicts
      const channelName = `report-progress-${reportCreated.id}-${Date.now()}`;
      console.log(`Creating channel with name: ${channelName}`);
      
      // Set up real-time subscription
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
            
            if (update.status === 'error') {
              console.log('Report generation error detected, showing error dialog');
              setShowErrorDialog(true);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Channel ${channelName} subscription status:`, status);
          
          // Inspect channel configuration after subscription
          setTimeout(() => {
            console.log('Channel configuration after subscription:');
            inspectChannels();
          }, 1000);
        });
        
      console.log('Subscription set up successfully');
      
      // Set up polling intervals as backup
      contentCheckInterval = window.setInterval(() => {
        checkReportContent();
      }, 5000); // Check every 5 seconds
      
      errorCheckInterval = window.setInterval(async () => {
        try {
          console.log('Performing manual error check...');
          const { data, error } = await supabase
            .from('report_progress')
            .select('*')
            .eq('report_id', reportCreated.id)
            .eq('status', 'error')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (error) {
            console.error('Error checking for error status:', error);
            return;
          }
          
          if (data && data.length > 0) {
            console.log('Found error status in manual check:', data[0]);
            setProgressUpdate(data[0] as ProgressUpdate);
            setShowErrorDialog(true);
          }
          
          // Also check if progress is 99% or higher without completion
          const { data: highProgressData, error: highProgressError } = await supabase
            .from('report_progress')
            .select('*')
            .eq('report_id', reportCreated.id)
            .gte('progress', 99)
            .neq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (!highProgressError && highProgressData && highProgressData.length > 0) {
            const update = highProgressData[0] as ProgressUpdate;
            console.log('Found high progress without completion:', update);
            
            // If it's been more than 10 seconds since the high progress update
            const updateTime = new Date(update.created_at).getTime();
            const currentTime = new Date().getTime();
            const elapsedSeconds = (currentTime - updateTime) / 1000;
            
            if (elapsedSeconds > 10) {
              console.log('High progress stuck for more than 10 seconds, treating as error');
              
              // Update progress report
              const updatedUpdate = {
                ...update,
                status: 'error' as const,
                message: update.message + ' (Timed out at high progress)'
              };
              setProgressUpdate(updatedUpdate);
              setShowErrorDialog(true);
            }
          }
        } catch (err) {
          console.error('Error in manual error check:', err);
        }
      }, 5000); // Check every 5 seconds
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
      if (errorCheckInterval) {
        window.clearInterval(errorCheckInterval);
      }
    };
  }, [reportCreated]);
  
  const inspectChannels = () => {
    try {
      if (!reportCreated?.id) {
        console.log('No report created yet, no channels to inspect');
        return;
      }
      
      // Get all active channels
      const channels = supabase.getChannels();
      
      console.log('Active Supabase channels:', channels);
      
      // Find channels related to the current report
      const reportChannels = channels.filter(channel => 
        channel.topic.includes(`report-progress-${reportCreated.id}`)
      );
      
      console.log(`Found ${reportChannels.length} channels for report ${reportCreated.id}:`, reportChannels);
      
      // Log detailed information about each channel
      reportChannels.forEach((channel, index) => {
        console.log(`Channel ${index + 1} details:`, {
          id: channel.id,
          topic: channel.topic,
          state: channel.state,
          joinedOnce: channel.joinedOnce,
          bindings: channel.bindings
        });
      });
      
      return reportChannels;
    } catch (error) {
      console.error('Error inspecting channels:', error);
      return [];
    }
  };

  useEffect(() => {
    if (progressUpdate && progressUpdate.status === 'error') {
      console.log('Progress update indicates error, showing error dialog:', progressUpdate);
      setShowErrorDialog(true);
    }
  }, [progressUpdate]);
  
  const navigateToReport = async () => {
    if (!reportCreated?.id) return;
    
    try {
      console.log(`Report ${reportCreated.id} completed, navigating to editor...`);
      const report = await fetchReportById(reportCreated.id);
      
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

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description, template_id')
        .eq('user_id', session.session.user.id);

      if (projectsError) throw projectsError;

      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('project_id')
        .eq('user_id', session.session.user.id);

      if (reportsError) throw reportsError;

      const projectsWithReports = new Set(reports.map(report => report.project_id));

      const projectDetails = await Promise.all(projects.map(async (project) => {
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
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (projectId: string) => {
    try {
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
      
      const reportData = {
        title: `${project.name} Report`,
        content: initialContent,
        project_id: projectId,
        user_id: userId,
        status: 'draft' as ReportStatus,
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
      
      // Create initial progress record
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
      
      const webhookUrls = [
        'https://n8n-01.imagicrafterai.com/webhook-test/58f03c25-d09d-4094-bd62-2a3d35514b6d',
        'https://n8n-01.imagicrafterai.com/webhook/58f03c25-d09d-4094-bd62-2a3d35514b6d'
      ];
      
      const appBaseUrl = window.location.origin;
      const callbackUrl = `${appBaseUrl}/api/report-progress/${newReport.id}`;
      
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
        job: jobUuid
      };
      
      console.log('Webhook payload:', webhookPayload);
      
      // Send webhook requests
      const webhookPromises = webhookUrls.map(async (webhookUrl) => {
        console.log(`Sending webhook to: ${webhookUrl}`);
        
        try {
          const postResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
          });
          
          if (postResponse.ok) {
            console.log(`Webhook POST request to ${webhookUrl} succeeded:`, await postResponse.text());
            return true;
          } else {
            console.error(`Webhook POST response error for ${webhookUrl}:`, await postResponse.text());
            
            // Fallback to GET request
            const getUrl = new URL(webhookUrl);
            Object.entries(webhookPayload).forEach(([key, value]) => {
              getUrl.searchParams.append(key, String(value));
            });
            
            const getResponse = await fetch(getUrl.toString(), {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            
            if (getResponse.ok) {
              console.log(`Webhook GET request to ${webhookUrl} succeeded:`, await getResponse.text());
              return true;
            } else {
              console.error(`Webhook GET response error for ${webhookUrl}:`, await getResponse.text());
              return false;
            }
          }
        } catch (error) {
          console.error(`Error sending webhook to ${webhookUrl}:`, error);
          return false;
        }
      });
      
      await Promise.all(webhookPromises);
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report. Please try again.');
      setCreatingReport(null);
    }
  };

  const handleReprocessReport = async () => {
    if (!reportCreated?.id) {
      console.error('No report ID available for reprocessing');
      return;
    }
    
    try {
      console.log('Reprocessing report...');
      setShowErrorDialog(false);
      
      // Get the project ID from the report
      const report = await fetchReportById(reportCreated.id);
      console.log('Retrieved report for reprocessing:', report);
      
      // Update the report status to archived so we don't create duplicates
      await supabase
        .from('reports')
        .update({ status: 'archived' })
        .eq('id', reportCreated.id);
      
      // Clean up state before starting a new report
      const projectId = report.project_id;
      setProgressUpdate(null);
      setReportCreated(null);
      
      // Restart the report creation process
      await handleCreateReport(projectId);
      
      toast.success('Report generation restarted');
    } catch (error) {
      console.error('Error reprocessing report:', error);
      toast.error('Failed to reprocess report. Please try again.');
      setShowErrorDialog(false); // Close dialog on error to allow user to try again
    }
  };

  const debugCheckChannels = () => {
    console.log('Manually checking channel configuration:');
    const channels = inspectChannels();
    toast.info(`Found ${channels?.length || 0} active channels for this report`);
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
                <div className="mt-3 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={debugCheckChannels}
                    className="text-xs"
                  >
                    Check Channel Config
                  </Button>
                </div>
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

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error Generating Report</AlertDialogTitle>
            <AlertDialogDescription>
              There was an error while generating your report. You can continue to the report editor to view the partial results or try to generate the report again.
              {progressUpdate?.message && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                  Error details: {progressUpdate.message}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={navigateToReport}>
              Continue to Report Editor
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReprocessReport}>
              Reprocess Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateReportModal;
