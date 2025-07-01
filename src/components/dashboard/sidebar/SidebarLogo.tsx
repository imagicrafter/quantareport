
import { Link } from 'react-router-dom';
import Logo from '../../ui-elements/Logo';

interface SidebarLogoProps {
  sidebarOpen: boolean;
}

const SidebarLogo = ({ sidebarOpen }: SidebarLogoProps) => {
  return (
    <div className="p-4 border-b">
      <Link to="/dashboard" className="flex items-center justify-center">
        <Logo 
          variant="sidebar" 
          sidebarCollapsed={!sidebarOpen} 
          size="md" 
        />
      </Link>
    </div>
  );
};

export default SidebarLogo;
