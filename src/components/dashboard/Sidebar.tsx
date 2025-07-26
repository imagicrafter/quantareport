
import { cn } from '@/lib/utils';
import SidebarLogo from './sidebar/SidebarLogo';
import SidebarToggle from './sidebar/SidebarToggle';
import SidebarNavigation from './sidebar/SidebarNavigation';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setShowCreateProject: (show: boolean) => void;
}

const Sidebar = ({ sidebarOpen, toggleSidebar, setShowCreateProject }: SidebarProps) => {
  return (
    <aside 
      className={cn(
        "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <SidebarLogo sidebarOpen={sidebarOpen} />
      <SidebarToggle sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <SidebarNavigation sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    </aside>
  );
};

export default Sidebar;
