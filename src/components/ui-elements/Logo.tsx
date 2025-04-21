
import { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'sidebar';
  sidebarCollapsed?: boolean;
}

const Logo: FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'default', 
  sidebarCollapsed = false 
}) => {
  const sizeClass = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  }[size];

  // Determine logo based on variant and sidebar state
  const logoSrc = 
    variant === 'sidebar' && sidebarCollapsed 
      ? '/images/Q_logo.png' 
      : '/images/QuantaReport_Logo.png';

  const logoAlt = 
    variant === 'sidebar' && sidebarCollapsed 
      ? 'Q' 
      : 'QuantaReport';

  return (
    <div className="flex items-center gap-2">
      <img 
        src={logoSrc} 
        alt={logoAlt} 
        className={sizeClass}
      />
    </div>
  );
};

export default Logo;

