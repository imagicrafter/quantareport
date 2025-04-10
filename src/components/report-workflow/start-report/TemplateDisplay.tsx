
interface TemplateDisplayProps {
  templateName: string | null;
}

const TemplateDisplay = ({ templateName }: TemplateDisplayProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-left">
        Template
      </label>
      <div className="p-3 border rounded-md bg-gray-50 min-h-[40px] flex items-center">
        {templateName ? (
          <span className="text-gray-800">{templateName}</span>
        ) : (
          <span className="text-gray-500">No default template available</span>
        )}
      </div>
    </div>
  );
};

export default TemplateDisplay;
