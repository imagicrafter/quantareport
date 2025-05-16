
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isDisabled: boolean;
}

const ActionButtons = ({ onSave, onCancel, isSaving, isDisabled }: ActionButtonsProps) => {
  return (
    <div className="flex justify-end gap-4 mt-8 max-w-3xl mx-auto">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={isDisabled || isSaving}
      >
        {isSaving ? (
          <>
            <span className="mr-2">Saving</span>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </>
        ) : (
          'Save'
        )}
      </Button>
    </div>
  );
};

export default ActionButtons;
