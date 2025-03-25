import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash, GripVertical } from 'lucide-react';
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
import { Note, reorderNotes, titleToCamelCase } from '@/utils/noteUtils';
import { NoteFileRelationship, fetchRelatedFiles } from '@/utils/noteFileRelationshipUtils';
import FilePicker from './notes/FilePicker';
import RelatedFiles from './notes/RelatedFiles';
import AudioRecorder from './files/AudioRecorder';

interface NotesSectionProps {
  projectId: string;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().optional(),
});

const editFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().optional(),
});

const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [relatedFiles, setRelatedFiles] = useState<NoteFileRelationship[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: '',
      content: '',
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
      toast({
        title: 'Error',
        description: 'Failed to load notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchNotes();
    }
  }, [projectId]);

  const fetchFileRelationships = async (noteId: string) => {
    const files = await fetchRelatedFiles(noteId);
    setRelatedFiles(files);
  };

  const handleAddNote = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
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

      const { error } = await supabase
        .from('notes')
        .insert({
          title: values.title,
          name: name,
          content: values.content || '',
          project_id: projectId,
          user_id: session.session.user.id,
          position: nextPosition
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully!',
      });

      form.reset();
      setIsAddDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = async (values: z.infer<typeof editFormSchema>) => {
    if (!selectedNote) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content || '',
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
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

      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });

      setIsDeleteDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
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
      
      toast({
        description: "Note order updated",
      });
    } catch (error) {
      console.error('Error reordering notes:', error);
      toast({
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Notes</h3>
        <Button 
          size="sm" 
          onClick={() => {
            form.reset();
            setIsAddDialogOpen(true);
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
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
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  isLoading={saving}
                >
                  Add Note
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto pr-2 py-2">
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
                
                {selectedNote && selectedNote.analysis && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Analysis</h4>
                    <div className="p-3 bg-secondary/30 rounded-md text-sm">
                      {selectedNote.analysis}
                    </div>
                  </div>
                )}
                
                {selectedNote && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Related Files</h4>
                      <FilePicker 
                        projectId={projectId} 
                        noteId={selectedNote.id}
                        onFileAdded={() => fetchFileRelationships(selectedNote.id)}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      <RelatedFiles 
                        noteId={selectedNote.id} 
                        relationships={relatedFiles}
                        onRelationshipsChanged={() => fetchFileRelationships(selectedNote.id)}
                      />
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>
          
          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-auto">
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

