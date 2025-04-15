
import { useState } from 'react';
import { Note } from '@/utils/noteUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useNoteDialogs = (refreshNotes: () => Promise<void>) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
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
      refreshNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedNote,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setSelectedNote,
    handleDeleteNote,
  };
};

