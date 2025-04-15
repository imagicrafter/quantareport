
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotesList from '@/components/dashboard/notes/NotesList';
import ExpandableNote from '@/components/dashboard/notes/ExpandableNote';
import { Note } from '@/utils/noteUtils';
import { useNotesContext } from '@/hooks/report-workflow/NotesContext';

interface NotesTabsPanelProps {
  notes: Note[];
  loading: boolean;
  onDragEnd: (result: any) => void;
  projectId: string;
}

const NotesTabsPanel = ({
  notes,
  loading,
  onDragEnd,
  projectId
}: NotesTabsPanelProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const { 
    handleEditNote, 
    handleDeleteNote,
    handleAnalyzeImages,
    relatedFiles,
    onFileAdded,
    handleTranscriptionComplete 
  } = useNotesContext();

  const filteredNotes = () => {
    if (activeTab === 'all') return notes;
    
    return notes.filter(note => {
      if (!note.metadata) return false;
      
      try {
        const metadata = typeof note.metadata === 'string' 
          ? JSON.parse(note.metadata) 
          : note.metadata;
          
        // Debug the metadata structure to verify category values
        console.log('Note metadata for filtering:', note.id, metadata);
        
        // Check if category exists and matches activeTab
        return metadata.category === activeTab;
      } catch (e) {
        console.error('Error parsing note metadata:', e, note.metadata);
        return false;
      }
    });
  };

  // Get the filtered notes for the current tab
  const notesToDisplay = filteredNotes();
  
  // Debug the filtering results
  console.log(`Tab: ${activeTab}, Total Notes: ${notes.length}, Filtered Notes: ${notesToDisplay.length}`);

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
              {activeTab === 'finding' ? (
                <div className="space-y-4">
                  {notesToDisplay.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border rounded-lg">
                      No findings added yet. Add a note with category "finding" to get started.
                    </div>
                  ) : (
                    notesToDisplay.map((note) => (
                      <ExpandableNote
                        key={note.id}
                        note={note}
                        onDelete={handleDeleteNote}
                        onUpdateNote={(n, values) => handleEditNote(n, values)}
                        onAnalyzeImages={() => handleAnalyzeImages(note.id)}
                        onTranscriptionComplete={handleTranscriptionComplete}
                        analyzingImages={analyzingImages}
                        projectId={projectId}
                        relatedFiles={relatedFiles[note.id] || []}
                        onFileAdded={() => onFileAdded(note.id)}
                        isLocked={note.files_relationships_is_locked || false}
                        onLockToggle={async (locked) => {
                          return handleEditNote(note, { 
                            title: note.title, 
                            content: note.content || '', 
                            analysis: note.analysis || '',
                            files_relationships_is_locked: locked 
                          });
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <NotesList 
                  notes={notesToDisplay}
                  loading={loading}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onDragEnd={onDragEnd}
                />
              )}
            </TabsContent>
          )}
        </ScrollArea>
      </div>
    </Tabs>
  );
};

export default NotesTabsPanel;
