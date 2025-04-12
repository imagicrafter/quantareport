
import { Button } from '@/components/ui/button';

interface StepNavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}

const StepNavigationButtons = ({
  onBack,
  onNext,
  nextLabel = "Next"
}: StepNavigationButtonsProps) => {
  return (
    <div className="flex-none border-t bg-background w-full py-4">
      <div className="max-w-3xl mx-auto w-full px-4 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        
        <Button onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
};

export default StepNavigationButtons;
