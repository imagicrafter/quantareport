
import { Search, Menu } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface DashboardHeaderProps {
  toggleSidebar: () => void;
  title: string;
}

const DashboardHeader = ({ toggleSidebar, title }: DashboardHeaderProps) => {
  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:flex">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="search" 
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 rounded-md border border-input bg-background w-64"
            />
          </div>
          
          <UserAvatar />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
