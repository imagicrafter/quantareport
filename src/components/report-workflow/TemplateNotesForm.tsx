
import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TemplateNote {
  id: string;
  title: string;
  name: string;
  custom_content: string | null;
  position: number | null;
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
  // and sort them by position
  const notesToShow = templateNotes
    .filter(note => Boolean(note.name))
    .sort((a, b) => {
      // Handle null positions by placing them at the end
      if (a.position === null && b.position === null) return 0;
      if (a.position === null) return 1;
      if (b.position === null) return -1;
      return a.position - b.position;
    });
  
  if (notesToShow.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-center mb-4">Template Notes</h2>
      
      <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
        {notesToShow.map((note) => (
          <div key={note.id} className="space-y-2">
            <Label htmlFor={`note-${note.id}`} className="block text-sm font-medium text-left">
              {note.title}
            </Label>
            
            {/* Use Textarea for longer content, Input for shorter content */}
            {(note.title?.length > 50) ? (
              <Textarea
                id={`note-${note.id}`}
                value={values[note.id] || ''}
                onChange={(e) => onChange(note.id, e.target.value)}
                placeholder={`Enter ${note.title.toLowerCase()}`}
                className="w-1/3"
              />
            ) : (
              <Input
                id={`note-${note.id}`}
                value={values[note.id] || ''}
                onChange={(e) => onChange(note.id, e.target.value)}
                placeholder={`Enter ${note.title.toLowerCase()}`}
                className="w-1/3"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateNotesForm;
