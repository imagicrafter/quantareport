
import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TemplateNote {
  id: string;
  title: string;
  name: string;
  custom_content: string | null;
}

interface TemplateNotesFormProps {
  templateNotes: TemplateNote[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

const TemplateNotesForm: FC<TemplateNotesFormProps> = ({ 
  templateNotes, 
  values, 
  onChange 
}) => {
  // Show notes that have a name (rather than filtering by custom_content)
  const notesToShow = templateNotes.filter(note => Boolean(note.name));
  
  if (notesToShow.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Template Notes</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {notesToShow.map((note) => (
          <div key={note.id} className="space-y-2">
            <label htmlFor={`note-${note.id}`} className="block text-sm font-medium">
              {note.title}
            </label>
            
            {/* Use Textarea for longer content, Input for shorter content */}
            {(note.title?.length > 50) ? (
              <Textarea
                id={`note-${note.id}`}
                value={values[note.id] || ''}
                onChange={(e) => onChange(note.id, e.target.value)}
                placeholder={`Enter ${note.title.toLowerCase()}`}
                rows={4}
              />
            ) : (
              <Input
                id={`note-${note.id}`}
                value={values[note.id] || ''}
                onChange={(e) => onChange(note.id, e.target.value)}
                placeholder={`Enter ${note.title.toLowerCase()}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateNotesForm;
