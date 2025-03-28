import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RelatedFiles from './notes/RelatedFiles';
import { titleToCamelCase } from '@/utils/noteUtils';

const NotesSection = ({ projectId }: { projectId: string }) => {
  return (
    <>
      <Header projectId={projectId} />
      <Content projectId={projectId} />
    </>
  );
};

const Header = ({ projectId }: { projectId: string }) => {
  const [isAddingNote, setIsAddingNote] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Project Notes</h2>
        <Button 
          onClick={() => setIsAddingNote(true)}
          variant="outline" 
          size="sm"
          className="gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          Add Note
        </Button>
      </div>
      {isAddingNote && <AddNoteForm projectId={projectId} onComplete={() => setIsAddingNote(false)} />}
    </div>
  );
};

const Content = ({ projectId }: { projectId: string }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select(`
          id, 
          content, 
          created_at, 
          user_id, 
          profiles(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .eq('user_id', session.session.user.id)
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

  if (loading) {
    return <div className="py-4 text-center">Loading notes...</div>;
  }

  if (notes.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No notes yet. Add your first note!</div>;
  }

  return (
    <div className="space-y-6">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} onUpdate={fetchNotes} projectId={projectId} />
      ))}
    </div>
  );
};

NotesSection.Header = Header;
NotesSection.Content = Content;

interface NoteItemProps {
  note: {
    id: string;
    content: string;
    created_at: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  };
  projectId: string;
  onUpdate: () => void;
}

const NoteItem = ({ note, projectId, onUpdate }: NoteItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      {isEditing ? (
        <EditNoteForm 
          noteId={note.id} 
          initialContent={note.content} 
          onComplete={handleEditComplete} 
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <div className="whitespace-pre-wrap mb-3">{note.content}</div>
          <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
            <div>
              {note.profiles?.full_name || 'Unknown user'} • {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleEdit}
                className="text-xs hover:underline"
              >
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="text-xs text-destructive hover:underline"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          <RelatedFiles noteId={note.id} projectId={projectId} />
        </>
      )}
    </div>
  );
};

const noteFormSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

interface AddNoteFormProps {
  projectId: string;
  onComplete: () => void;
}

const AddNoteForm = ({ projectId, onComplete }: AddNoteFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add notes.',
          variant: 'destructive',
        });
        return;
      }

      const firstLine = values.content.split('\n')[0].trim();
      const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
      const name = titleToCamelCase(title);

      const { error } = await supabase
        .from('notes')
        .insert({
          content: values.content,
          title: title,
          name: name,
          project_id: projectId,
          user_id: session.session.user.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully!',
      });
      form.reset();
      onComplete();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-6 bg-card">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    placeholder="Write your note here..." 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onComplete}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

interface EditNoteFormProps {
  noteId: string;
  initialContent: string;
  onComplete: () => void;
  onCancel: () => void;
}

const EditNoteForm = ({ noteId, initialContent, onComplete, onCancel }: EditNoteFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  const onSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: values.content })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });
      onComplete();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NotesSection;
