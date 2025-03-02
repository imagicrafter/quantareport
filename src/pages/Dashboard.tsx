
import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import ProjectsHeader from '../components/dashboard/ProjectsHeader';
import ProjectsTable from '../components/dashboard/ProjectsTable';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleProjectCreated = () => {
    // Trigger a refresh of projects
    setRefreshTrigger(prev => prev + 1);
  };

  // Get the current path to determine which title to display in header
  const currentPath = location.pathname.split('/').pop() || 'projects';
  const pageTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  // If the path is exactly /dashboard, redirect to /dashboard/projects
  if (location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/projects" replace />;
  }

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        setShowCreateProject={setShowCreateProject} 
      />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <DashboardHeader toggleSidebar={toggleSidebar} title={pageTitle} />

        {/* Render child routes */}
        {location.pathname === '/dashboard/projects' ? (
          <div className="p-4 md:p-6">
            <StatCards projects={projects} />
            <ProjectsHeader setShowCreateProject={setShowCreateProject} />
            <ProjectsTable onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      
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
