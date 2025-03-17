
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Plus, FolderPlus, Image, FileText, FileCheck, FileArchive, Settings, LogOut, Shield } from 'lucide-react';
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

  const menuItems = [
    { name: 'Projects', icon: <FolderPlus size={20} />, path: '/dashboard/projects' },
    { name: 'Images', icon: <Image size={20} />, path: '/dashboard/images' },
    { name: 'Notes', icon: <FileText size={20} />, path: '/dashboard/notes' },
    { name: 'Templates', icon: <FileCheck size={20} />, path: '/dashboard/templates' },
    { name: 'Reports', icon: <FileArchive size={20} />, path: '/dashboard/reports' },
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
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Logo variant="default" />
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-sidebar-accent md:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setShowCreateProject(true)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            <span>New Project</span>
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
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="border-t border-sidebar-border p-4 space-y-2">
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                currentPath === '/admin' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
              }`}
            >
              <Shield size={20} />
              <span>Admin</span>
            </Link>
          )}
          <Link
            to="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
              currentPath === '/dashboard/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
