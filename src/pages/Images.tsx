
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface ProjectWithImageCount {
  id: string;
  name: string;
  description: string | null;
  image_count: number;
  last_updated: string;
}

const Images = () => {
  const [projects, setProjects] = useState<ProjectWithImageCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectsWithImages();
  }, []);

  const fetchProjectsWithImages = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        window.location.href = '/signin';
        return;
      }

      // Get all projects with image counts
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          created_at
        `)
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      // For each project, get the count of images
      const projectsWithImageCounts = await Promise.all(
        data.map(async (project) => {
          const { count, error: countError } = await supabase
            .from('files')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('user_id', session.session.user.id)
            .in('type', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

          if (countError) {
            console.error('Error fetching image count:', countError);
            return {
              ...project,
              image_count: 0,
              last_updated: project.created_at,
            };
          }

          // Get last updated image for this project
          const { data: lastImageData, error: lastImageError } = await supabase
            .from('files')
            .select('created_at')
            .eq('project_id', project.id)
            .eq('user_id', session.session.user.id)
            .in('type', ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
            .order('created_at', { ascending: false })
            .limit(1);

          const lastUpdated = lastImageData && lastImageData.length > 0 
            ? lastImageData[0].created_at 
            : project.created_at;

          return {
            ...project,
            image_count: count || 0,
            last_updated: lastUpdated,
          };
        })
      );

      // Sort by last_updated descending and filter projects with images
      const filteredProjects = projectsWithImageCounts
        .filter(project => project.image_count > 0)
        .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());

      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching projects with images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load image data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Images" toggleSidebar={() => {}} />
      
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Images</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Images</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-44 animate-pulse">
                  <CardHeader className="bg-gray-200 h-full rounded-md"></CardHeader>
                </Card>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{project.image_count} images</p>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Last updated: {new Date(project.last_updated).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No images found. Upload images to your projects to see them here.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Images;
