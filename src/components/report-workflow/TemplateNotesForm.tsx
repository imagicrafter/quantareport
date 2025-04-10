
import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TemplateNote {
  id: string;
  title: string;
  name: string;
  custom_content: string;
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
  // Filter notes that have custom_content
  const notesWithCustomContent = templateNotes.filter(note => note.custom_content);
  
  if (notesWithCustomContent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Template Notes</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {notesWithCustomContent.map((note) => (
          <div key={note.id} className="space-y-2">
            <label htmlFor={`note-${note.id}`} className="block text-sm font-medium">
              {note.title}
            </label>
            
            {note.custom_content.length > 100 ? (
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
