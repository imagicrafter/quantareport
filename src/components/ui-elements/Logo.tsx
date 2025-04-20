
import { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

const Logo: FC<LogoProps> = ({ size = 'md', variant = 'default' }) => {
  const sizeClass = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  }[size];

  return (
    <div className="flex items-center gap-2">
      {variant === 'default' ? (
        <img 
          src="/images/QuantaReport_logo.png" 
          alt="QuantaReport" 
          className={sizeClass}
        />
      ) : (
        <img 
          src="/images/Q_logo.png" 
          alt="Q" 
          className={sizeClass}
        />
      )}
    </div>
  );
};

export default Logo;
