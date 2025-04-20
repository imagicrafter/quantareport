import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  FileText, 
  Image, 
  FileEdit, 
  Settings, 
  Users, 
  Menu,
  ChevronDown,
  ChevronRight, 
  Wand2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import Logo from '../ui-elements/Logo';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setShowCreateProject: (show: boolean) => void;
}

const Sidebar = ({ sidebarOpen, toggleSidebar, setShowCreateProject }: SidebarProps) => {
  const location = useLocation();
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const isReportsActive = () => {
    return location.pathname.includes('/reports') || 
           location.pathname.includes('/report-wizard') ||
           location.pathname.includes('/dashboard/projects');
  };

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };

    checkAdminRole();
  }, []);
  
  return (
    <aside 
      className={cn(
        "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-4 border-b">
        <Link to="/dashboard" className="flex items-center justify-center">
          <Logo 
            variant="sidebar" 
            sidebarCollapsed={!sidebarOpen} 
            size="md" 
          />
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
        <div className="px-4 space-y-1">
          <div>
            <button
              onClick={() => setReportsExpanded(!reportsExpanded)}
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

            {(sidebarOpen && reportsExpanded) && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/dashboard/report-wizard/start"
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors",
                    location.pathname.includes('/dashboard/report-wizard')
                      ? "bg-accent text-quanta-blue"
                      : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
                  )}
                >
                  <Wand2 size={16} className="mr-2" />
                  <span>Report Wizard</span>
                </Link>
                <Link
                  to="/dashboard/reports"
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors",
                    isActive('/dashboard/reports')
                      ? "bg-accent text-quanta-blue"
                      : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
                  )}
                >
                  <FileText size={16} className="mr-2" />
                  <span>View Reports</span>
                </Link>
                <Link
                  to="/dashboard/projects"
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm font-medium transition-colors",
                    isActive('/dashboard/projects')
                      ? "bg-accent text-quanta-blue"
                      : "text-gray-700 hover:bg-accent/50 hover:text-quanta-blue"
                  )}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  <span>View Projects</span>
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
          
          {isAdmin && (
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
          )}
        </div>
        
        <div className="mt-auto">
          <div className="px-4 mb-2">
            <button 
              onClick={toggleSidebar}
              className={cn(
                "w-full flex items-center p-2 rounded-md transition-colors",
                "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                sidebarOpen ? "justify-end" : "justify-center"
              )}
            >
              {sidebarOpen ? (
                <ArrowLeft size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>
          </div>
          
          <div className={cn(
            "px-4 py-2",
            sidebarOpen ? "text-left" : "text-center"
          )}>
            <UserAvatar showName={sidebarOpen} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
