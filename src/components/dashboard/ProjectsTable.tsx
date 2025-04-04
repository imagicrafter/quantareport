
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import Button from '../ui-elements/Button';
import ProjectViewDrawer from './ProjectViewDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Template {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  date: string;
  imageCount: number;
  noteCount: number;
  reportStatus: string;
  template?: Template | null;
}

interface ProjectsTableProps {
  onRefresh?: () => void; 
}

const ProjectsTable = ({ onRefresh }: ProjectsTableProps) => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return;
      }

      // Fetch projects with template information
      const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          created_at, 
          status,
          template_id,
          templates(id, name)
        `)
        .eq('user_id', session.session.user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Get notes count for each project
      const projectsWithCounts = await Promise.all((projectData || []).map(async (project) => {
        // Count notes
        const { count: noteCount, error: noteError } = await supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id);

        if (noteError) console.error('Error counting notes:', noteError);

        // Count image files
        const { count: imageCount, error: imageError } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('type', 'image');

        if (imageError) console.error('Error counting images:', imageError);

        return {
          id: project.id,
          name: project.name,
          date: project.created_at,
          reportStatus: project.status,
          noteCount: noteCount || 0,
          imageCount: imageCount || 0,
          template: project.templates
        };
      }));

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [onRefresh]);

  const handleViewProject = (projectId: string) => {
    setSelectedProject(projectId);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    // Refresh projects after closing the view drawer
    fetchProjects();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Success',
      description: 'Project ID copied to clipboard',
    });
  };

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="w-[20%]">Template</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No projects found. Create your first project to get started.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                    <TableCell>
                      <div className="font-medium break-words">{project.name}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(project.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="break-words">{project.template?.name || 'None'}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {project.imageCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {project.noteCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.reportStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : project.reportStatus === 'processing' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.reportStatus.charAt(0).toUpperCase() + project.reportStatus.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProject(project.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedProject && (
        <ProjectViewDrawer 
          open={isViewOpen}
          onClose={handleCloseView}
          projectId={selectedProject}
        />
      )}
    </>
  );
};

export default ProjectsTable;
