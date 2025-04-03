
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { Folder, FileImage, File, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FilesSection from '@/components/dashboard/FilesSection';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import StatCards from '@/components/dashboard/StatCards';

interface Project {
  id: string;
  name: string;
  description: string | null;
  imageCount: number;
  lastUpdated: Date | null;
}

const Images = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<{id: string; name: string} | null>(null);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [stats, setStats] = useState({
    projects: 0,
    images: 0,
    notes: 0,
    reports: 0
  });

  // Fetch stats for the cards at the top
  const fetchStats = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    try {
      // Get project count
      const { count: projectCount, error: projectError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.session.user.id);

      if (projectError) throw projectError;

      // Get image count
      const { count: imageCount, error: imageError } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.session.user.id)
        .eq('type', 'image');

      if (imageError) throw imageError;

      // Get note count
      const { count: noteCount, error: noteError } = await supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.session.user.id);

      if (noteError) throw noteError;

      // Get report count
      const { count: reportCount, error: reportError } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.session.user.id);

      if (reportError) throw reportError;

      setStats({
        projects: projectCount || 0,
        images: imageCount || 0,
        notes: noteCount || 0,
        reports: reportCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch projects with image counts
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description, created_at')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (projectError) throw projectError;

      // Get image counts for each project
      const projectsWithImageCounts = await Promise.all(
        projects.map(async (project) => {
          const { count: imageCount, error } = await supabase
            .from('files')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('type', 'image');

          if (error) {
            console.error('Error getting image count:', error);
            return {
              ...project,
              imageCount: 0,
              lastUpdated: new Date(project.created_at)
            };
          }

          // Get the last updated file for this project
          const { data: latestFile, error: latestError } = await supabase
            .from('files')
            .select('created_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastUpdated = latestFile && latestFile.length > 0 
            ? new Date(latestFile[0].created_at) 
            : new Date(project.created_at);

          return {
            ...project,
            imageCount: imageCount || 0,
            lastUpdated
          };
        })
      );

      setProjects(projectsWithImageCounts);
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

  const handleProjectClick = (project: Project) => {
    setSelectedProject({
      id: project.id,
      name: project.name
    });
    setIsFilesModalOpen(true);
  };

  const handleCloseFilesModal = () => {
    setIsFilesModalOpen(false);
    setSelectedProject(null);
  };

  useEffect(() => {
    fetchStats();
    fetchProjects();
  }, []);

  return (
    <>
      <DashboardHeader title="Images" toggleSidebar={() => {}} />
      
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Stats Cards */}
        <StatCards projects={projects} />
        
        <h2 className="text-2xl font-semibold mb-4">Images</h2>

        {/* Recent Files Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1"></div>
          <h3 className="text-xl font-medium">Recent Files</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">
              No projects with images found. Create a project and add images to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleProjectClick(project)}
              >
                <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {project.description || "No description"}
                </p>
                
                <p className="font-medium">
                  {project.imageCount} {project.imageCount === 1 ? 'image' : 'images'}
                </p>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Last updated: {project.lastUpdated ? format(project.lastUpdated, 'M/d/yyyy') : 'Never'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Files Modal for selected project */}
      {selectedProject && (
        <Dialog open={isFilesModalOpen} onOpenChange={handleCloseFilesModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex items-center justify-between">
              <DialogTitle>{selectedProject.name} - Files</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseFilesModal}
                className="absolute right-4 top-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              <FilesSection 
                projectId={selectedProject.id} 
                projectName={selectedProject.name} 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Images;
