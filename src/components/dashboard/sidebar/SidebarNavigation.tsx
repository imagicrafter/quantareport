
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Image, FileEdit, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReportsSubMenu from './ReportsSubMenu';

interface SidebarNavigationProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarNavigation = ({ sidebarOpen, toggleSidebar }: SidebarNavigationProps) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
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
    <div className="flex-1 py-4 overflow-y-auto">
      <div className="px-4 space-y-1">
        <ReportsSubMenu sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

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
    </div>
  );
};

export default SidebarNavigation;
