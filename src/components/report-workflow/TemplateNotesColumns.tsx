
import { TemplateNote } from '@/hooks/report-workflow/useTemplateData';

interface TemplateNotesColumnsProps {
  templateNotes: TemplateNote[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

const TemplateNotesColumns = ({ templateNotes, values, onChange }: TemplateNotesColumnsProps) => {
  const midpoint = Math.ceil(templateNotes.length / 2);
  const leftColumnNotes = templateNotes.slice(0, midpoint);
  const rightColumnNotes = templateNotes.slice(midpoint);

  const renderNote = (note: TemplateNote) => (
    <div key={note.id} className="mb-4">
      <label className="block text-sm font-medium mb-1" htmlFor={note.id}>
        {note.title}
      </label>
      <textarea
        id={note.id}
        className="w-full min-h-[100px] p-2 border rounded-md"
        value={values[note.id] || ''}
        onChange={(e) => onChange(note.id, e.target.value)}
        placeholder={`Enter ${note.title.toLowerCase()}`}
      />
    </div>
  );

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
