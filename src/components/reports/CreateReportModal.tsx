
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createReport, ReportStatus, fetchReportById } from './ReportService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  image_count: number;
  notes_count: number;
  has_report: boolean;
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
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    // Poll for report content if a report has been created
    let interval: number | null = null;
    
    if (reportCreated?.id) {
      interval = window.setInterval(async () => {
        try {
          console.log(`Checking if report ${reportCreated.id} content has been updated...`);
          const report = await fetchReportById(reportCreated.id);
          
          // If content has been updated and is different from initial content
          if (report.content && report.content !== reportCreated.content) {
            console.log('Report content has been updated, navigating to editor...');
            clearInterval(interval!);
            setReportCreated(null);
            onClose();
            navigate(`/dashboard/reports/editor/${report.id}`);
          }
        } catch (error) {
          console.error('Error checking report content:', error);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [reportCreated, navigate, onClose]);

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
        .select('id, name, description')
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
      
      const reportData = {
        title: `${project.name} Report`,
        content: `Report for project: ${project.name}`,
        project_id: projectId,
        user_id: userId,
        status: 'draft' as ReportStatus, // Explicitly cast to ReportStatus type
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
      
      toast.success('Report created. Generating content...');
      
      // Send webhook notification with more comprehensive payload
      try {
        // Fixed webhook URL - using GET instead of POST as per error message
        const webhookUrl = 'https://n8n-01.imagicrafterai.com/webhook-test/58f03c25-d09d-4094-bd62-2a3d35514b6d';
        
        const webhookPayload = {
          project_id: projectId,
          report_id: newReport.id,
          user_id: userId,
          project_name: project.name,
          timestamp: new Date().toISOString(),
          image_count: imageUrls.length,
          action: 'generate_report'
        };
        
        console.log('Sending webhook payload:', webhookPayload);
        console.log('Webhook URL:', webhookUrl);
        
        // Try both GET and POST to determine which one works
        const getUrl = new URL(webhookUrl);
        // Add all payload fields as query parameters
        Object.entries(webhookPayload).forEach(([key, value]) => {
          getUrl.searchParams.append(key, String(value));
        });
        
        // First try GET request
        const getResponse = await fetch(getUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (getResponse.ok) {
          console.log('Webhook GET request succeeded:', await getResponse.text());
        } else {
          console.log('Webhook GET request failed, trying POST...');
          
          // If GET fails, try POST request
          const postResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
          });
          
          if (postResponse.ok) {
            console.log('Webhook POST request succeeded:', await postResponse.text());
          } else {
            console.error('Webhook POST response error:', await postResponse.text());
          }
        }
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
        // Continue even if webhook fails
      }
      
      // Don't navigate yet - wait for the polling to detect content update
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
                      disabled={creatingReport === project.id || reportCreated !== null}
                      className="w-full"
                    >
                      {creatingReport === project.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Report...
                        </>
                      ) : reportCreated !== null ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Content...
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
