
import { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

const Logo: FC<LogoProps> = ({ size = 'md', variant = 'default' }) => {
  const sizeClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute -inset-0.5 rounded-full bg-primary/20 blur-sm"></div>
        <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
          <span className="text-white font-semibold text-sm">R</span>
        </div>
      </div>
      {variant === 'default' && (
        <span className={`font-semibold ${sizeClass} bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80`}>
          Reportify
        </span>
      )}
    </div>
  );
};

export default Logo;
