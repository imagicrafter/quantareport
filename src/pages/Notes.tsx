
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import NotesSection from '@/components/dashboard/NotesSection';

interface ProjectWithNotesCount {
  id: string;
  name: string;
  description: string | null;
  notes_count: number;
  last_updated: string;
}

const Notes = () => {
  const [projects, setProjects] = useState<ProjectWithNotesCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectsWithNotes();
  }, []);

  const fetchProjectsWithNotes = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        window.location.href = '/signin';
        return;
      }

      // Get all projects
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

      // For each project, get the count of notes
      const projectsWithNotesCounts = await Promise.all(
        data.map(async (project) => {
          const { count, error: countError } = await supabase
            .from('notes')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('user_id', session.session.user.id);

          if (countError) {
            console.error('Error fetching notes count:', countError);
            return {
              ...project,
              notes_count: 0,
              last_updated: project.created_at,
            };
          }

          // Get last updated note for this project
          const { data: lastNoteData, error: lastNoteError } = await supabase
            .from('notes')
            .select('created_at')
            .eq('project_id', project.id)
            .eq('user_id', session.session.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastUpdated = lastNoteData && lastNoteData.length > 0 
            ? lastNoteData[0].created_at 
            : project.created_at;

          return {
            ...project,
            notes_count: count || 0,
            last_updated: lastUpdated,
          };
        })
      );

      // Sort by last_updated descending and filter projects with notes
      const filteredProjects = projectsWithNotesCounts
        .filter(project => project.notes_count > 0)
        .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());

      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching projects with notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsNotesModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNotesModalOpen(false);
    // Refresh the projects list to update the note counts and last updated times
    fetchProjectsWithNotes();
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Notes" toggleSidebar={() => {}} />
      
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Notes</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Notes</h2>
          
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
                <Card 
                  key={project.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{project.notes_count} notes</p>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Last updated: {new Date(project.last_updated).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No notes found. Create notes in your projects to see them here.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProjectId && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold">
                  {projects.find(p => p.id === selectedProjectId)?.name} - Notes
                </h2>
              </div>
              <NotesSection projectId={selectedProjectId} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
