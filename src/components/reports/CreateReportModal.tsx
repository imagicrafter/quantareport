
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createReport, ReportStatus } from './ReportService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
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
        // Get image count using the specified query
        const { count: imageCount, error: imageError } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('user_id', session.session.user.id)
          .eq('type', 'image');

        if (imageError) {
          console.error('Error fetching image count:', imageError);
        }

        // Get notes count using the specified query
        const { count: notesCount, error: notesError } = await supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('user_id', session.session.user.id);

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

      // Filter to only show projects without reports
      const filteredProjects = projectDetails.filter(project => !project.has_report);
      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects. Please try again.');
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
        .in('type', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
        
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
        template_id: project.template_id || ''
      };
      
      const newReport = await createReport(reportData);
      
      // Send webhook notification
      try {
        await fetch('https://n8n-01.imagicrafterai.com/webhook-test/58f03c25-d09d-4094-bd62-2a3d35514b6d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_id: projectId,
            report_id: newReport.id,
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
        // Continue even if webhook fails
      }
      
      toast.success('Report created successfully');
      onClose();
      navigate(`/dashboard/reports/editor/${newReport.id}`);
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report. Please try again.');
    } finally {
      setCreatingReport(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Report</DialogTitle>
          <DialogDescription>
            Select a project to create a new report. Only projects without existing reports are shown.
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
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0">
                    <p>{project.image_count} {project.image_count === 1 ? 'Image' : 'Images'}</p>
                    <p>{project.notes_count} {project.notes_count === 1 ? 'Note' : 'Notes'}</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleCreateReport(project.id)}
                      disabled={creatingReport === project.id}
                      className="w-full"
                    >
                      {creatingReport === project.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : 'Create Report'}
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
