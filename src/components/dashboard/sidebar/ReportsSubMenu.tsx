
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportsSubMenuProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const ReportsSubMenu = ({ sidebarOpen, toggleSidebar }: ReportsSubMenuProps) => {
  const location = useLocation();
  const [reportsExpanded, setReportsExpanded] = useState(false);

  const isReportsActive = () => {
    return location.pathname.includes('/reports') || 
           location.pathname.includes('/report-wizard');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Auto-expand Reports sub-menu when on Reports routes
  useEffect(() => {
    if (isReportsActive()) {
      setReportsExpanded(true);
    }
  }, [location.pathname]);

  const handleReportsClick = () => {
    if (!sidebarOpen) {
      // If sidebar is collapsed, expand it first
      toggleSidebar();
    }
    // Toggle the reports expansion manually
    setReportsExpanded(!reportsExpanded);
  };

  return (
    <div>
      <button
        onClick={handleReportsClick}
        className={cn(
          "w-full flex items-center justify-between rounded-md py-2.5 px-3 text-sm font-medium transition-colors",
          "focus:outline-none",
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
        </div>
      )}
    </div>
  );
};

export default ReportsSubMenu;
