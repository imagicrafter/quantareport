
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ReportModeSelectorProps {
  value: 'new' | 'update';
  onChange: (value: 'new' | 'update') => void;
}

const ReportModeSelector = ({ value, onChange }: ReportModeSelectorProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <RadioGroup
        value={value}
        onValueChange={(value) => onChange(value as 'new' | 'update')}
        className="flex items-center space-x-6"
        defaultValue="new"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="option-new" />
          <Label htmlFor="option-new">New Report</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="update" id="option-update" />
          <Label htmlFor="option-update">Existing Report</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ReportModeSelector;
