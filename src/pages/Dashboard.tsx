
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import ProjectsHeader from '../components/dashboard/ProjectsHeader';
import ProjectsTable from '../components/dashboard/ProjectsTable';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Dashboard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const location = useLocation();
  
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
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

  // Get the current path to determine which title to display in header
  const currentPath = location.pathname.split('/').pop() || 'projects';
  const pageTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <DashboardHeader title={pageTitle} toggleSidebar={() => {}} />

      {/* Main Content - if we're on the projects page specifically */}
      <div className="p-4 md:p-6">
        <StatCards projects={projects} />
        <ProjectsHeader setShowCreateProject={setShowCreateProject} />
        <ProjectsTable onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
        
        {/* Render child routes if present (for future nested routes) */}
        <Outlet />
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
