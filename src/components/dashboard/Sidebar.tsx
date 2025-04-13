import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, FileText, Image, FileEdit, Settings, Users, FilePlus, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setShowCreateProject: (show: boolean) => void;
}

const Sidebar = ({ sidebarOpen, toggleSidebar, setShowCreateProject }: SidebarProps) => {
  const location = useLocation();
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const isReportsActive = () => {
    return location.pathname.includes('/reports') || 
           location.pathname.includes('/report-wizard');
  };

  const isProjectsActive = () => {
    return location.pathname.includes('/dashboard/projects');
  };
  
  const expandReports = () => {
    setReportsExpanded(!reportsExpanded);
  };

  const expandProjects = () => {
    setProjectsExpanded(!projectsExpanded);
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          {sidebarOpen ? (
            <span className="text-xl font-bold text-quanta-blue">QuantaReport</span>
          ) : (
            <span className="text-xl font-bold text-quanta-blue">QR</span>
          )}
        </Link>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
          {sidebarOpen ? (
            <ArrowLeft size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>
      
      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
        <div className="px-4 space-y-1">
          {/* Projects Section with Submenu */}
          <div>
            <button
              onClick={expandProjects}
              className={cn(
                "w-full flex items-center justify-between rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
                isProjectsActive()
                  ? "bg-quanta-blue text-white"
                  : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
              )}
            >
              <div className="flex items-center">
                <LayoutDashboard 
                  size={20} 
                  className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
                />
                {sidebarOpen && <span>Projects</span>}
              </div>
              {sidebarOpen && (
                projectsExpanded ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              )}
            </button>

            {/* Projects Submenu */}
            {(sidebarOpen && projectsExpanded) && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/dashboard/projects"
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors",
                    isActive('/dashboard/projects')
                      ? "bg-accent text-quanta-blue"
                      : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
                  )}
                >
                  <span>View Projects</span>
                </Link>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="w-full flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors text-gray-700 hover:bg-accent/50 hover:text-quanta-blue text-left"
                >
                  <span>New Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Reports Section with Submenu */}
          <div>
            <button
              onClick={expandReports}
              className={cn(
                "w-full flex items-center justify-between rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
                isReportsActive()
                  ? "bg-quanta-blue text-white"
                  : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
              )}
            >
              <div className="flex items-center">
                <FileText 
                  size={20} 
                  className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
                />
                {sidebarOpen && <span>Reports</span>}
              </div>
              {sidebarOpen && (
                reportsExpanded ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              )}
            </button>

            {/* Reports Submenu */}
            {(sidebarOpen && reportsExpanded) && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/dashboard/reports"
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors",
                    isActive('/dashboard/reports')
                      ? "bg-accent text-quanta-blue"
                      : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
                  )}
                >
                  <span>All Reports</span>
                </Link>
                <Link
                  to="/dashboard/report-wizard/start"
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors",
                    location.pathname.includes('/dashboard/report-wizard')
                      ? "bg-accent text-quanta-blue"
                      : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
                  )}
                >
                  <span>Wizard</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/dashboard/templates"
            className={cn(
              "flex items-center rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
              isActive('/dashboard/templates')
                ? "bg-quanta-blue text-white"
                : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
            )}
          >
            <FileEdit 
              size={20} 
              className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
            />
            {sidebarOpen && <span>Templates</span>}
          </Link>
          
          <Link
            to="/dashboard/images"
            className={cn(
              "flex items-center rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
              isActive('/dashboard/images')
                ? "bg-quanta-blue text-white"
                : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
            )}
          >
            <Image 
              size={20} 
              className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
            />
            {sidebarOpen && <span>Images</span>}
          </Link>
          
          <Link
            to="/dashboard/notes"
            className={cn(
              "flex items-center rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
              isActive('/dashboard/notes')
                ? "bg-quanta-blue text-white"
                : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
            )}
          >
            <FileText 
              size={20} 
              className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
            />
            {sidebarOpen && <span>Notes</span>}
          </Link>
          
          <Link
            to="/dashboard/settings"
            className={cn(
              "flex items-center rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
              isActive('/dashboard/settings')
                ? "bg-quanta-blue text-white"
                : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
            )}
          >
            <Settings 
              size={20} 
              className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
            />
            {sidebarOpen && <span>Settings</span>}
          </Link>
          
          <Link
            to="/dashboard/admin"
            className={cn(
              "flex items-center rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
              isActive('/dashboard/admin')
                ? "bg-quanta-blue text-white"
                : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
            )}
          >
            <Users 
              size={20} 
              className={cn("flex-shrink-0", sidebarOpen ? "mr-2" : "mx-auto")} 
            />
            {sidebarOpen && <span>Admin</span>}
          </Link>
        </div>
        
        {/* User Profile */}
        <div className={cn(
          "mt-auto px-4 py-2",
          sidebarOpen ? "text-left" : "text-center"
        )}>
          <UserAvatar showName={sidebarOpen} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
