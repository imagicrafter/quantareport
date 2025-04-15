
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/utils/noteUtils';
import { titleToCamelCase } from '@/utils/noteUtils';

export const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().optional(),
  analysis: z.string().optional(),
});

export type NoteFormValues = z.infer<typeof formSchema>;

export const useNoteForm = (
  projectId: string,
  refreshNotes: () => Promise<void>
) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });

  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });

  const handleAddNote = async (values: NoteFormValues) => {
    if (!projectId) return;

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

      const { data: positionData } = await supabase
        .from('notes')
        .select('position')
        .eq('project_id', projectId)
        .order('position', { ascending: false })
        .limit(1);
        
      const nextPosition = positionData && positionData.length > 0 
        ? Math.max(...positionData.map(note => note.position || 0)) + 1 
        : 1;

      const name = titleToCamelCase(values.title);

      const { error } = await supabase
        .from('notes')
        .insert({
          title: values.title,
          name,
          content: values.content || '',
          analysis: values.analysis || null,
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
      refreshNotes();
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

  const handleEditNote = async (note: Note, values: NoteFormValues) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content || '',
          analysis: values.analysis || null,
        })
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });

      editForm.reset();
      refreshNotes();
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

  return {
    form,
    editForm,
    saving,
    handleAddNote,
    handleEditNote,
  };
};

