
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, FolderPlus, Image, FileText, FileCheck, FileArchive, Settings, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '../ui-elements/Logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setShowCreateProject: (show: boolean) => void;
}

const Sidebar = ({ sidebarOpen, toggleSidebar, setShowCreateProject }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.session.user.id)
          .single();
        
        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    
    checkUserRole();
  }, []);

  // Updated menu items with Reports moved between Projects and Notes
  const menuItems = [
    { name: 'Templates', icon: <FileCheck size={20} />, path: '/dashboard/templates' },
    { name: 'Projects', icon: <FolderPlus size={20} />, path: '/dashboard/projects' },
    { name: 'Reports', icon: <FileArchive size={20} />, path: '/dashboard/reports' },
    { name: 'Notes', icon: <FileText size={20} />, path: '/dashboard/notes' },
    { name: 'Images', icon: <Image size={20} />, path: '/dashboard/images' },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Successfully signed out');
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-full flex flex-col relative">
        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-sidebar border border-sidebar-border rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent z-10 hidden md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className={`transition-all duration-300 ${collapsed ? 'scale-75 -ml-2' : ''}`}>
            <Logo variant="default" />
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-sidebar-accent md:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                  currentPath.includes(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }`}
                title={collapsed ? item.name : ''}
              >
                {item.icon}
                <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="border-t border-sidebar-border p-4 space-y-2">
          {isAdmin && (
            <Link
              to="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                currentPath.includes('/dashboard/admin') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
              }`}
              title={collapsed ? 'Admin' : ''}
            >
              <Shield size={20} />
              <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Admin
              </span>
            </Link>
          )}
          <Link
            to="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
              currentPath === '/dashboard/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            title={collapsed ? 'Settings' : ''}
          >
            <Settings size={20} />
            <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Settings
            </span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            title={collapsed ? 'Sign out' : ''}
          >
            <LogOut size={20} />
            <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Sign out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
