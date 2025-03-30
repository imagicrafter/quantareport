
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/utils/noteUtils';

export const useNotes = (projectId: string) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');

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

  return { 
    notes, 
    setNotes, 
    loading, 
    projectName,
    refreshNotes: fetchNotes 
  };
};
