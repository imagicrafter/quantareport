
import { ArrowLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarToggleProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarToggle = ({ sidebarOpen, toggleSidebar }: SidebarToggleProps) => {
  return (
    <div className="px-4 py-2 border-b border-transparent">
      <button 
        onClick={toggleSidebar}
        className={cn(
          "w-full flex items-center p-2 rounded-md transition-all duration-200",
          "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
          "focus:outline-none",
          sidebarOpen ? "justify-end" : "justify-center"
        )}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <ArrowLeft size={18} />
        ) : (
          <Menu size={18} />
        )}
      </button>
    </div>
  );
};

export default SidebarToggle;
