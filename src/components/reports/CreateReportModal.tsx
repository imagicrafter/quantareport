
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import ReportGenerationProgress from './ReportGenerationProgress';
import { useReportGeneration } from '@/hooks/reports/useReportGeneration';

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

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateReportModal = ({ isOpen, onClose }: CreateReportModalProps) => {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    creatingReport,
    generationInProgress,
    reportCreated,
    progressUpdate,
    handleCreateReport
  } = useReportGeneration();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

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
