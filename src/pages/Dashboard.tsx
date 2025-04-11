
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import ProjectsHeader from '../components/dashboard/ProjectsHeader';
import ProjectsTable from '../components/dashboard/ProjectsTable';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Dashboard = () => {
  const [showCreateProject, setShowCreateProject] = useOutletContext<[boolean, React.Dispatch<React.SetStateAction<boolean>>]>();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          // Redirect to sign in if not authenticated
          window.location.href = '/signin';
          return;
        }

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', session.session.user.id);

        if (error) throw error;
        setProjects(data || []);
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

    fetchProjects();
  }, [refreshTrigger, toast]);
  
  const handleProjectCreated = () => {
    // Trigger a refresh of projects
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <DashboardHeader title="Projects" toggleSidebar={() => {}} />

      {/* Main Content */}
      <div className="p-4 md:p-6">
        <StatCards projects={projects} />
        <ProjectsHeader setShowCreateProject={setShowCreateProject} />
        <ProjectsTable onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
      </div>
      
      {/* Create Project Modal */}
      <CreateProjectModal 
        showCreateProject={showCreateProject}
        setShowCreateProject={setShowCreateProject}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Dashboard;
