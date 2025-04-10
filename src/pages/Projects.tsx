
import React from 'react';
import ProjectsTable from '@/components/dashboard/ProjectsTable';
import ProjectsHeader from '@/components/dashboard/ProjectsHeader';
import { useState } from 'react';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';

const Projects = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshProjects = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <ProjectsHeader onCreateProject={() => setIsCreateModalOpen(true)} />
      
      <div className="mt-8">
        <ProjectsTable refreshTrigger={refreshTrigger} />
      </div>
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refreshProjects();
        }}
      />
    </div>
  );
};

export default Projects;
