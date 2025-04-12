
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotesList from '@/components/dashboard/notes/NotesList';
import { Note } from '@/utils/noteUtils';
import { useNotesContext } from '@/hooks/report-workflow/NotesContext';

interface NotesTabsPanelProps {
  notes: Note[];
  loading: boolean;
  onDragEnd: (result: any) => void;
}

const NotesTabsPanel = ({
  notes,
  loading,
  onDragEnd
}: NotesTabsPanelProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const { handleEditNote, handleDeleteNote } = useNotesContext();

  const filteredNotes = () => {
    if (activeTab === 'all') return notes;
    
    return notes.filter(note => {
      if (!note.metadata) return false;
      try {
        const metadata = note.metadata;
        return metadata.category === activeTab;
      } catch (e) {
        return false;
      }
    });
  };

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
      <TabsList className="grid w-full grid-cols-4 mb-6 flex-none">
        <TabsTrigger value="all">All Notes</TabsTrigger>
        <TabsTrigger value="observation">Observations</TabsTrigger>
        <TabsTrigger value="finding">Findings</TabsTrigger>
        <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
      </TabsList>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {activeTab && (
            <TabsContent value={activeTab} className="mt-0 h-full">
              <NotesList 
                notes={filteredNotes()}
                loading={loading}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                onDragEnd={onDragEnd}
              />
            </TabsContent>
          )}
        </ScrollArea>
      </div>
    </Tabs>
  );
};

export default NotesTabsPanel;
