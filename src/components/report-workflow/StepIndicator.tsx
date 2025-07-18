
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface StepProps {
  number: number;
  title?: string;
  isActive: boolean;
  isPast?: boolean;
  onClick: () => void;
  isLast?: boolean;
}

const StepItem: FC<StepProps> = ({ number, title, isActive, isPast = false, onClick, isLast = false }) => {
  return (
    <div 
      className={cn(
        "relative flex items-center cursor-pointer group",
        isPast && "hover:bg-gray-300"
      )}
      onClick={onClick}
    >
      {/* Main content */}
      <div 
        className={cn(
          "flex items-center justify-center h-12 px-4",
          isActive 
            ? "bg-quanta-blue text-white" 
            : isPast 
              ? "bg-gray-300 text-gray-800 hover:bg-gray-400" 
              : "bg-gray-200 text-gray-700"
        )}
      >
        <span className="font-medium whitespace-nowrap">{title || `Step ${number}`}</span>
      </div>
      
      {/* Right arrow/chevron */}
      {!isLast && (
        <div 
          className={cn(
            "h-0 w-0 border-y-[24px] border-y-transparent",
            isActive 
              ? "border-l-[12px] border-l-quanta-blue" 
              : isPast
                ? "border-l-[12px] border-l-gray-300 group-hover:border-l-gray-400"
                : "border-l-[12px] border-l-gray-200 group-hover:border-l-gray-300"
          )}
        />
      )}
    </div>
  );
};

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
  steps?: Array<{ title: string, path?: string }>;
}

const StepIndicator: FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  steps 
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-center bg-white">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <StepItem
            key={index}
            number={index + 1}
            title={steps?.[index]?.title || `Step ${index + 1}`}
            isActive={currentStep === index + 1}
            isPast={currentStep > index + 1}
            onClick={() => onStepClick(index + 1)}
            isLast={index === totalSteps - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
