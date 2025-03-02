
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash } from 'lucide-react';
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
import Button from '../ui-elements/Button';

interface NotesSectionProps {
  projectId: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().min(5, 'Content must be at least 5 characters.')
});

const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: ''
    }
  });

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
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
    fetchNotes();
  }, [projectId]);

  const handleAddNote = () => {
    form.reset({
      title: '',
      content: ''
    });
    setIsEditing(false);
    setCurrentNoteId(null);
    setIsDialogOpen(true);
  };

  const handleEditNote = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      
      form.reset({
        title: data.title,
        content: data.content
      });
      
      setIsEditing(true);
      setCurrentNoteId(noteId);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching note for edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to load note data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Note deleted successfully!'
      });
      
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a note.',
          variant: 'destructive',
        });
        return;
      }

      if (isEditing && currentNoteId) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: values.title,
            content: values.content
          })
          .eq('id', currentNoteId);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Note updated successfully!'
        });
      } else {
        // Create new note
        const { error } = await supabase
          .from('notes')
          .insert({
            title: values.title,
            content: values.content,
            project_id: projectId,
            user_id: session.session.user.id
          });

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Note created successfully!'
        });
      }
      
      setIsDialogOpen(false);
      form.reset();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Notes</h3>
        <Button 
          variant="outline" 
          size="sm" 
          icon={<Plus size={16} />}
          onClick={handleAddNote}
        >
          Add Note
        </Button>
      </div>
      
      {loading ? (
        <div className="py-4 text-center">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No notes found. Create your first note for this project.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-md p-4 bg-card">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{note.title}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditNote(note.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm line-clamp-3">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Note' : 'Create Note'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter note content" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                >
                  {isEditing ? 'Update Note' : 'Save Note'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesSection;
