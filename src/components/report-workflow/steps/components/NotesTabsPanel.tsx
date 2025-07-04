
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotesList from '@/components/dashboard/notes/NotesList';
import ExpandableNote from '@/components/dashboard/notes/ExpandableNote';
import { Note } from '@/utils/noteUtils';
import { useNotesContext } from '@/hooks/report-workflow/NotesContext';
import { Droppable, Draggable } from 'react-beautiful-dnd';

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
  const [activeTab, setActiveTab] = useState('finding');
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const {
    handleEditNote,
    handleDeleteNote,
    handleAnalyzeImages,
    relatedFiles,
    onFileAdded,
    handleTranscriptionComplete
  } = useNotesContext();

  return (
    <Tabs defaultValue="finding" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
      <TabsList className="grid w-full grid-cols-4 mb-6 flex-none">
        <TabsTrigger value="finding">Findings</TabsTrigger>
        <TabsTrigger value="all">Analysis</TabsTrigger>
        <TabsTrigger value="observation">Observations</TabsTrigger>
        <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
      </TabsList>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {activeTab && (
            <TabsContent value={activeTab} className="mt-0 h-full">
              {activeTab === 'finding' ? (
                <Droppable droppableId="findings-list">
                  {(provided) => (
                    <div 
                      className="space-y-4" 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {notes.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground border rounded-lg">
                          No notes added yet.
                        </div>
                      ) : (
                        notes.map((note, index) => (
                          <Draggable key={note.id} draggableId={note.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
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
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <NotesList
                  notes={activeTab === 'all' ? notes : notes.filter(note => {
                    if (!note.metadata) return false;
                    try {
                      const metadata = typeof note.metadata === 'string'
                        ? JSON.parse(note.metadata)
                        : note.metadata;
                      return metadata.category === activeTab;
                    } catch (e) {
                      return false;
                    }
                  })}
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
