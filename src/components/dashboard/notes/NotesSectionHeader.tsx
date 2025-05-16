
import React from 'react';
import { PlusCircle } from 'lucide-react';
import Button from '@/components/ui-elements/Button';

interface NotesSectionHeaderProps {
  onAddNote: () => void;
}

const NotesSectionHeader = ({ onAddNote }: NotesSectionHeaderProps) => {
  return (
    <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
      <h3 className="text-lg font-medium">Project Notes</h3>
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          onClick={onAddNote}
        >
          <PlusCircle size={16} className="mr-2" />
          Add Note
        </Button>
      </div>
    </div>
  );
};

export default NotesSectionHeader;
