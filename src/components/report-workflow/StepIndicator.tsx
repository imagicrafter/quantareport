
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface StepProps {
  number: number;
  title?: string;
  isActive: boolean;
  onClick: () => void;
  isLast?: boolean;
}

const StepItem: FC<StepProps> = ({ number, title, isActive, onClick, isLast = false }) => {
  return (
    <div 
      className={cn(
        "relative h-12 flex items-center cursor-pointer",
        isLast ? "pr-4" : "pr-6"
      )}
      onClick={onClick}
    >
      {/* Main content */}
      <div 
        className={cn(
          "flex items-center justify-center h-full px-4 z-10",
          isActive ? "bg-quanta-blue text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        )}
      >
        <span className="font-medium whitespace-nowrap">{title || `Step ${number}`}</span>
      </div>
      
      {/* Right arrow */}
      {!isLast && (
        <div 
          className={cn(
            "absolute right-0 top-0 h-0 w-0 border-y-[24px] border-y-transparent z-20",
            isActive 
              ? "border-l-[12px] border-l-quanta-blue" 
              : "border-l-[12px] border-l-gray-200 group-hover:border-l-gray-300"
          )}
        />
      )}
      
      {/* Background cutout for next step */}
      {!isLast && (
        <div 
          className="absolute right-0 top-0 h-0 w-0 border-y-[24px] border-y-transparent border-l-[12px] border-l-white z-10"
          style={{ right: "-1px" }}
        />
      )}
    </div>
  );
};

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
  steps?: Array<{ title: string }>;
}

const StepIndicator: FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  steps 
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center bg-white min-w-max">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <StepItem
            key={index}
            number={index + 1}
            title={steps?.[index]?.title}
            isActive={currentStep === index + 1}
            onClick={() => onStepClick(index + 1)}
            isLast={index === totalSteps - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
