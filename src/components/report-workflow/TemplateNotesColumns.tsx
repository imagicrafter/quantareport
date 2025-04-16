
import { TemplateNote } from '@/hooks/report-workflow/useTemplateData';
import { useState } from 'react';

interface TemplateNotesColumnsProps {
  templateNotes: TemplateNote[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

const TemplateNotesColumns = ({ templateNotes, values, onChange }: TemplateNotesColumnsProps) => {
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const midpoint = Math.ceil(templateNotes.length / 2);
  const leftColumnNotes = templateNotes.slice(0, midpoint);
  const rightColumnNotes = templateNotes.slice(midpoint);

  const toggleExpand = (id: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderNote = (note: TemplateNote) => {
    const isExpanded = expandedFields[note.id];

    return (
      <div key={note.id} className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor={note.id}>
          {note.title}
        </label>
        <div className="relative">
          <textarea
            id={note.id}
            className={`w-full p-2 border rounded-md transition-all duration-200 ${
              isExpanded ? 'min-h-[200px]' : 'h-[4.5rem]'
            }`}
            value={values[note.id] || ''}
            onChange={(e) => onChange(note.id, e.target.value)}
            placeholder={`Enter ${note.title.toLowerCase()}`}
          />
          <button
            type="button"
            onClick={() => toggleExpand(note.id)}
            className="absolute bottom-2 right-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {leftColumnNotes.map(renderNote)}
      </div>
      <div className="space-y-4">
        {rightColumnNotes.map(renderNote)}
      </div>
    </div>
  );
};

export default TemplateNotesColumns;
