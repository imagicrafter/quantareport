
import { Input } from '@/components/ui/input';

interface ReportNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ReportNameInput = ({ value, onChange }: ReportNameInputProps) => {
  return (
    <div>
      <label htmlFor="reportName" className="block text-sm font-medium mb-1 text-left">
        Report Name
      </label>
      <Input
        id="reportName"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter report name"
        className="w-full"
      />
    </div>
  );
};

export default ReportNameInput;
