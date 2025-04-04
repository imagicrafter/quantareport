
import { FC, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon'; // Added 'icon' as a valid size
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = "rounded-md font-medium transition-all duration-200 focus:outline-none inline-flex items-center justify-center";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    icon: "p-2" // Added icon size
  };
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  };
  
  const disabledClasses = "opacity-50 cursor-not-allowed";
  const loadingClasses = "relative !text-transparent transition-none hover:!text-transparent";

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        isLoading && loadingClasses,
        props.disabled && disabledClasses,
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && !isLoading && (
        <span className={cn("mr-2", size === "sm" ? "text-sm" : "text-base")}>{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !isLoading && (
        <span className={cn("ml-2", size === "sm" ? "text-sm" : "text-base")}>{icon}</span>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className={cn(
              "animate-spin",
              size === "sm" ? "h-4 w-4" : "h-5 w-5",
              variant === 'primary' ? "text-primary-foreground/70" : "text-foreground/70"
            )}
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </button>
  );
};

export default Button;
