
import { FC } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepBannerProps {
  step: number;
  isActive: boolean;
  onClick: () => void;
}

const StepBanner: FC<StepBannerProps> = ({ step, isActive, onClick }) => {
  return (
    <div 
      className={cn(
        "relative flex items-center px-4 py-2 min-w-[150px] cursor-pointer transition-colors",
        isActive 
          ? "bg-quanta-blue text-white" 
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      )}
      onClick={onClick}
    >
      <span className="font-medium mr-2">Step {step}</span>
      
      {/* Arrow */}
      <div className="absolute -right-3 top-0 h-full flex items-center z-10">
        <ChevronRight 
          className={cn(
            "h-6 w-6",
            isActive ? "text-quanta-blue" : "text-gray-200"
          )}
        />
      </div>
      
      {/* Connector */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-full w-3",
          isActive ? "bg-quanta-blue" : "bg-gray-200"
        )}
      />
    </div>
  );
};

export default StepBanner;
