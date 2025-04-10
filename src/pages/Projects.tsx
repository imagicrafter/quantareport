
import React from 'react';
import ProjectsTable from '@/components/dashboard/ProjectsTable';
import ProjectsHeader from '@/components/dashboard/ProjectsHeader';
import { useState } from 'react';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';

const Projects = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshProjects = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <ProjectsHeader setShowCreateProject={setShowCreateProject} />
      
      <div className="mt-8">
        <ProjectsTable onRefresh={refreshProjects} />
      </div>
      
      <CreateProjectModal 
        showCreateProject={showCreateProject} 
        setShowCreateProject={setShowCreateProject}
        onProjectCreated={refreshProjects}
      />
    </div>
  );
};

export default Projects;
