
import React, { useState } from 'react';
import Sidebar from '../dashboard/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        setShowCreateProject={setShowCreateProject} 
      />
      <main className="flex-1 overflow-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
