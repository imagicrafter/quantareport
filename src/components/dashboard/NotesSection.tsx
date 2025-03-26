
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash, GripVertical, ImageIcon, File } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Button from '../ui-elements/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Note, reorderNotes, titleToCamelCase, submitImageAnalysis, NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { NoteFileRelationship, fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';
import FilePicker from './notes/FilePicker';
import RelatedFiles from './notes/RelatedFiles';
import AudioRecorder from './files/AudioRecorder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ExtendedNote extends Note {
  analysis?: string | null;
}

interface NotesSectionProps {
  projectId: string;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().optional(),
  analysis: z.string().optional(),
});

const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { toast: uiToast } = useToast();
  const [notes, setNotes] = useState<ExtendedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ExtendedNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [relatedFiles, setRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const [addNoteRelatedFiles, setAddNoteRelatedFiles] = useState<NoteFileRelationshipWithType[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [addNoteId, setAddNoteId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to load notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectName = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProjectName(data?.name || '');
    } catch (error) {
      console.error('Error fetching project name:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchNotes();
      fetchProjectName();
    }
  }, [projectId]);

  const fetchFileRelationships = async (noteId: string) => {
    // Only fetch relationships if the note ID is a valid UUID
    if (noteId && !noteId.startsWith('temp-')) {
      const filesWithTypes = await fetchRelatedFiles(noteId);
      setRelatedFiles(filesWithTypes);
    }
  };

  const handleAddNote = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        uiToast({
          title: 'Error',
          description: 'You must be logged in to add notes.',
          variant: 'destructive',
        });
        return;
      }

      const nextPosition = notes.length > 0 
        ? Math.max(...notes.map(note => note.position || 0)) + 1 
        : 1;

      const name = titleToCamelCase(values.title);

      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: values.title,
          name: name,
          content: values.content || '',
          analysis: values.analysis || null,
          project_id: projectId,
          user_id: session.session.user.id,
          position: nextPosition
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // If we have temporary related files, create real relationships
        if (addNoteRelatedFiles.length > 0) {
          for (const relFile of addNoteRelatedFiles) {
            if (relFile.file_id) {
              await supabase
                .from('note_file_relationships')
                .insert({
                  note_id: data.id,
                  file_id: relFile.file_id
                });
            }
          }
        }
      }

      uiToast({
        title: 'Success',
        description: 'Note added successfully!',
      });

      form.reset();
      setAddNoteRelatedFiles([]);
      setIsAddDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setAddNoteId(null);
    }
  };

  const handleEditNote = async (values: z.infer<typeof formSchema>) => {
    if (!selectedNote) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content || '',
          analysis: values.analysis || null,
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      uiToast({
        title: 'Success',
        description: 'Note updated successfully!',
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', selectedNote.id);

      if (error) throw error;

      uiToast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });

      setIsDeleteDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOnDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    try {
      const updatedNotes = await reorderNotes(notes, sourceIndex, destinationIndex);
      setNotes(updatedNotes);
      
      uiToast({
        description: "Note order updated",
      });
    } catch (error) {
      console.error('Error reordering notes:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to update note order',
        variant: 'destructive',
      });
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    form.setValue('content', text);
  };

  const handleEditTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };

  const checkAnalysisStatus = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('analysis')
        .eq('id', noteId)
        .single();
        
      if (error) {
        console.error('Error fetching note status:', error);
        return false;
      }
      
      if (data && data.analysis) {
        console.log('Analysis completed:', data.analysis.substring(0, 50) + '...');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return false;
    }
  };

  const startPollingForAnalysisCompletion = (noteId: string, isAdd: boolean = false) => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
    }
    
    const maxAttempts = 30;
    let attempts = 0;
    
    const intervalId = window.setInterval(async () => {
      attempts++;
      console.log(`Checking analysis status: attempt ${attempts}/${maxAttempts}`);
      
      const isComplete = await checkAnalysisStatus(noteId);
      
      if (isComplete) {
        clearInterval(intervalId);
        setPollingInterval(null);
        setAnalyzingImages(false);
        
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();
          
        if (!error && data) {
          if (isAdd) {
            form.setValue('analysis', data.analysis || '');
          } else {
            editForm.setValue('analysis', data.analysis || '');
            setSelectedNote(prevNote => prevNote ? { ...prevNote, analysis: data.analysis } : null);
          }
          toast.success('Image analysis completed');
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setPollingInterval(null);
        setAnalyzingImages(false);
        toast.error('Analysis is taking longer than expected. Please check back later.');
      }
    }, 2000);
    
    setPollingInterval(intervalId);
  };

  const handleAnalyzeImages = async (isAdd: boolean = false) => {
    const noteId = isAdd ? addNoteId : selectedNote?.id;
    if (!noteId) return;
    
    setAnalyzingImages(true);
    
    try {
      const imageRelationships = (isAdd ? addNoteRelatedFiles : relatedFiles).filter(rel => 
        rel.file_type === 'image'
      );
      
      if (imageRelationships.length === 0) {
        toast('No images available for analysis', {
          description: 'Add some images to analyze first'
        });
        setAnalyzingImages(false);
        return;
      }
      
      const imageUrls = imageRelationships.map(rel => rel.file_path);
      
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      const success = await submitImageAnalysis(
        noteId,
        projectId,
        imageUrls,
        isTestMode
      );
      
      if (!success) {
        throw new Error('Failed to submit image analysis request');
      }
      
      toast.success('Image analysis started');
      startPollingForAnalysisCompletion(noteId, isAdd);
      
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('Failed to analyze images');
      setAnalyzingImages(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingInterval !== null) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Helper function to generate a unique temporary file relationship ID
  const generateTempRelationshipId = () => `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Add file to the temporary related files for the new note
  const handleAddFileToNewNote = (fileId: string, fileType: string, filePath: string) => {
    const newRelationship: NoteFileRelationshipWithType = {
      id: generateTempRelationshipId(),
      note_id: addNoteId || '',
      file_id: fileId,
      created_at: new Date().toISOString(),
      file_type: fileType,
      file_path: filePath
    };
    
    setAddNoteRelatedFiles(prev => [...prev, newRelationship]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Notes</h3>
        <Button 
          size="sm" 
          onClick={() => {
            form.reset();
            setIsAddDialogOpen(true);
            setAddNoteId(`temp-${Date.now()}`);
            setAddNoteRelatedFiles([]);
          }}
        >
          <PlusCircle size={16} className="mr-2" />
          Add Note
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-lg">
          No notes added yet. Add your first note to get started.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="notes-list">
            {(provided) => (
              <div 
                className="space-y-2" 
                {...provided.droppableProps} 
                ref={provided.innerRef}
              >
                {notes.map((note, index) => (
                  <Draggable key={note.id} draggableId={note.id} index={index}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                      >
                        <div className="flex items-center w-full">
                          <div 
                            {...provided.dragHandleProps} 
                            className="px-2 cursor-grab"
                          >
                            <GripVertical size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{note.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedNote(note);
                                editForm.reset({
                                  title: note.title,
                                  content: note.content,
                                  analysis: note.analysis || '',
                                });
                                fetchFileRelationships(note.id);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedNote(note);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddNote)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter note title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Content (Optional)</FormLabel>
                        <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter note content" 
                          className="min-h-[70px]"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="analysis"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Analysis</FormLabel>
                        <Button
                          type="button"
                          onClick={() => handleAnalyzeImages(true)}
                          isLoading={analyzingImages}
                          disabled={!addNoteId || addNoteRelatedFiles.length === 0}
                          className="flex items-center gap-1"
                        >
                          <ImageIcon size={16} />
                          <span>Analyze Images</span>
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Analysis content"
                          className="min-h-[100px]"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {addNoteId && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium mb-2">Related Files</div>
                      <div className="mb-2">
                        <FilePicker
                          projectId={projectId}
                          noteId={addNoteId}
                          onFileAdded={() => {
                            if (addNoteId) {
                              // For the Add Note modal, we'll manage temporary file relationships
                              // until the note is actually created
                              setAddNoteRelatedFiles([...addNoteRelatedFiles]);
                            }
                          }}
                          relatedFiles={addNoteRelatedFiles}
                        />
                      </div>
                      {addNoteRelatedFiles.length > 0 ? (
                        <div className="mt-2">
                          <RelatedFiles 
                            noteId={addNoteId} 
                            projectId={projectId}
                            relationships={addNoteRelatedFiles}
                            onRelationshipsChanged={() => {
                              if (addNoteId) {
                                // For temporary relationships, just refresh the state
                                setAddNoteRelatedFiles([...addNoteRelatedFiles]);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-secondary/30 rounded-md p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center bg-secondary rounded-full">
                              <File size={16} />
                            </div>
                            <span className="text-sm font-medium">
                              0 files attached
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button 
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddDialogOpen(false);
                setAddNoteId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(handleAddNote)}
              isLoading={saving}
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditNote)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter note title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Content (Optional)</FormLabel>
                        <AudioRecorder onTranscriptionComplete={handleEditTranscriptionComplete} />
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter note content" 
                          className="min-h-[70px]"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="analysis"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Analysis</FormLabel>
                        <Button
                          type="button"
                          onClick={() => handleAnalyzeImages()}
                          isLoading={analyzingImages}
                          className="flex items-center gap-1"
                        >
                          <ImageIcon size={16} />
                          <span>Analyze Images</span>
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Analysis content"
                          className="min-h-[200px]"
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedNote && (
                  <div className="space-y-4">
                    <RelatedFiles 
                      noteId={selectedNote.id} 
                      projectId={projectId}
                      relationships={relatedFiles}
                      onRelationshipsChanged={() => fetchFileRelationships(selectedNote.id)}
                    />
                  </div>
                )}
              </form>
            </Form>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={editForm.handleSubmit(handleEditNote)}
              isLoading={saving}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="primary"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteNote}
              isLoading={saving}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesSection;
