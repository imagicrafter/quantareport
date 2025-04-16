
import React from 'react';

interface TemplateDisplayProps {
  templateName?: string | null;
}

const TemplateDisplay = ({ templateName }: TemplateDisplayProps) => {
  return (
    <div className="bg-accent/30 p-4 rounded-md">
      <label className="block text-sm font-medium mb-1 text-left">
        Current Template
      </label>
      <div className="text-muted-foreground">
        {templateName || 'No template selected'}
      </div>
    </div>
  );
};

export default TemplateDisplay;
