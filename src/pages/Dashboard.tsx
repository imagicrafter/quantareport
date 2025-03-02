
import { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import ProjectsHeader from '../components/dashboard/ProjectsHeader';
import ProjectsTable from '../components/dashboard/ProjectsTable';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  const projects = [
    { id: '1', name: 'Site Inspection Report', date: '2023-05-15', imageCount: 12, reportStatus: 'completed' },
    { id: '2', name: 'Property Damage Assessment', date: '2023-06-22', imageCount: 8, reportStatus: 'draft' },
    { id: '3', name: 'Construction Progress', date: '2023-07-10', imageCount: 24, reportStatus: 'processing' },
  ];
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
        <DashboardHeader toggleSidebar={toggleSidebar} title="Projects" />

        {/* Page content */}
        <div className="p-4 md:p-6">
          <StatCards projects={projects} />
          <ProjectsHeader setShowCreateProject={setShowCreateProject} />
          <ProjectsTable projects={projects} />
        </div>
      </main>
      
      {/* Create Project Modal */}
      <CreateProjectModal 
        showCreateProject={showCreateProject}
        setShowCreateProject={setShowCreateProject}
      />
    </div>
  );
};

export default Dashboard;
