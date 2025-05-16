
import { FC } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepBannerProps {
  step: number;
  isActive: boolean;
  onClick: () => void;
  title?: string;  // Optional title
  description?: string;  // Optional description
}

const StepBanner: FC<StepBannerProps> = ({ 
  step, 
  isActive, 
  onClick, 
  title, 
  description
}) => {
  return (
    <div className="mb-6">
      <div 
        className={cn(
          "relative flex items-center justify-center px-4 py-2 min-w-[150px] cursor-pointer transition-colors",
          isActive 
            ? "bg-quanta-blue text-white border border-quanta-blue" 
            : "bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
        )}
        onClick={onClick}
      >
        <span className="font-medium mr-2">Step {step}</span>
        
        {/* Arrow */}
        <div className="absolute -right-3 top-0 h-full z-10 flex items-center">
          <ChevronRight 
            className={cn(
              "h-6 w-6",
              isActive ? "text-quanta-blue" : "text-gray-300"
            )}
          />
        </div>
        
        {/* Connector */}
        <div 
          className={cn(
            "absolute right-0 top-0 h-full w-3",
            isActive 
              ? "bg-quanta-blue border border-quanta-blue" 
              : "bg-gray-200 border border-gray-300"
          )}
        />
      </div>
      
      {/* Title and Description (if provided) */}
      {(title || description) && (
        <div className="mt-4">
          {title && <h2 className="text-2xl font-semibold mb-2">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
    </div>
  );
};

export default StepBanner;
