
interface TemplateDisplayProps {
  templateName: string | null;
}

const TemplateDisplay = ({ templateName }: TemplateDisplayProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-left">
        Template
      </label>
      <div className="p-2 border rounded-md bg-gray-50">
        {templateName || 'No default template available'}
      </div>
    </div>
  );
};

export default TemplateDisplay;
