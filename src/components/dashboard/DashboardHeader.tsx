
import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface DashboardHeaderProps {
  toggleSidebar: () => void;
  title: string;
}

const DashboardHeader = ({ toggleSidebar, title }: DashboardHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`relative hidden md:flex ${isSearchFocused ? 'w-80' : 'w-64'} transition-all duration-200`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="search" 
              placeholder="Search projects..."
              className="pl-10 pr-8 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={handleClearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <UserAvatar />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
