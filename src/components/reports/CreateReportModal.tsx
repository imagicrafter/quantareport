
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
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    // Subscribe to real-time progress updates if a report has been created
    let subscription: any = null;
    
    if (reportCreated?.id) {
      // Subscribe to progress_updates table for this report
      subscription = supabase
        .channel('report-progress')
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
            setProgressUpdate(update);
            
            // If status is completed or progress is 100%, navigate to report editor
            if (update.status === 'completed' || update.progress >= 100) {
              navigateToReport();
            }
          }
        )
        .subscribe();
        
      // Also poll for content updates as a fallback
      const contentCheckInterval = window.setInterval(() => {
        checkReportContent();
      }, 5000); // Check every 5 seconds
      
      return () => {
        supabase.removeChannel(subscription);
        clearInterval(contentCheckInterval);
      };
    }
    
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [reportCreated]);
  
  const navigateToReport = async () => {
    if (!reportCreated?.id) return;
    
    try {
      console.log(`Report ${reportCreated.id} completed, navigating to editor...`);
      const report = await fetchReportById(reportCreated.id);
      
      // Reset state before navigation
      setReportCreated(null);
      setProgressUpdate(null);
      onClose();
      
      // Navigate to the report editor
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
      
      // If content has been updated and is different from initial content
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

      // Get all projects for the user
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description, template_id')
        .eq('user_id', session.session.user.id);

      if (projectsError) throw projectsError;

      // Get all reports for the user
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('project_id')
        .eq('user_id', session.session.user.id);

      if (reportsError) throw reportsError;

      // Create a set of project IDs that already have reports
      const projectsWithReports = new Set(reports.map(report => report.project_id));

      // Get image and note counts for each project directly from the database
      const projectDetails = await Promise.all(projects.map(async (project) => {
        // Get image count
        const { count: imageCount, error: imageError } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('type', 'image');

        if (imageError) {
          console.error('Error fetching image count:', imageError);
        }

        // Get notes count
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

      // No longer filtering out projects with reports
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
      
      // Get project details for report
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Get images for the project
      const { data: images, error: imagesError } = await supabase
        .from('files')
        .select('file_path')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('type', 'image');
        
      if (imagesError) throw imagesError;
      
      // Create the report
      const imageUrls = images ? images.map(img => img.file_path) : [];
      
      // Generate a basic initial content for the report
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
      
      // Store the new report ID and initial content to poll for updates
      setReportCreated({
        id: newReport.id,
        content: newReport.content
      });
      
      // Generate a job UUID for tracking this report generation
      const jobUuid = uuidv4();
      
      // Create initial progress update
      await supabase
        .from('report_progress')
        .insert({
          report_id: newReport.id,
          status: 'generating',
          message: 'Starting report generation...',
          progress: 5,
          job: jobUuid
        });
      
      toast.success('Report created. Generating content...');
      
      // Send webhook notifications with more comprehensive payload
      try {
        // Define webhook URLs - now we have two webhooks to send to
        const webhookUrls = [
          'https://n8n-01.imagicrafterai.com/webhook-test/58f03c25-d09d-4094-bd62-2a3d35514b6d',
          'https://n8n-01.imagicrafterai.com/webhook/58f03c25-d09d-4094-bd62-2a3d35514b6d'
        ];
        
        // Get the application base URL for callback
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
        
        // Send POST requests to both webhooks
        const webhookPromises = webhookUrls.map(async (webhookUrl) => {
          console.log(`Sending webhook to: ${webhookUrl}`);
          
          try {
            // Send POST request
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
              
              // As a fallback, try GET request
              const getUrl = new URL(webhookUrl);
              // Add all payload fields as query parameters
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
        
        // Wait for all webhook requests to complete
        await Promise.all(webhookPromises);
      } catch (webhookError) {
        console.error('Error sending webhooks:', webhookError);
        // Continue even if webhook fails
      }
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report. Please try again.');
      setCreatingReport(null);
    }
  };

  return (
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
  );
};

export default CreateReportModal;
