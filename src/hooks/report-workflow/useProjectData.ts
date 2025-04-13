
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { loadTemplateNotes } from '@/utils/templateNoteUtils';

export const useProjectData = () => {
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [reportName, setReportName] = useState('');
  const { toast } = useToast();

  const fetchExistingProjects = async () => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }
      
      // Load existing projects for the Update Report mode
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (projectsError) {
        throw projectsError;
      }
      
      setExistingProjects(projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load existing projects. Please try again.',
      });
    }
  };

  const handleProjectSelect = async (
    projectId: string,
    getIsLoading: () => boolean,
    getDefaultTemplate: () => any,
    setTemplateNotes: (notes: any[]) => void,
    setTemplateNoteValues: (values: Record<string, string>) => void
  ) => {
    if (!projectId) return;
    
    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*, templates(*)')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Set report name from project
      setReportName(project.name);
      
      // Set template from project
      if (project.template_id) {
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', project.template_id)
          .single();
          
        if (templateError) throw templateError;
        
        // Load template notes structure first
        const templateNotes = await loadTemplateNotes(template.id);
        setTemplateNotes(templateNotes || []);
        
        // Load existing notes content for this project
        const { data: notes, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('project_id', projectId);
          
        if (notesError) throw notesError;
        
        // Map notes to template notes based on name match
        if (notes && templateNotes) {
          const noteValues: Record<string, string> = {};
          
          templateNotes.forEach(templateNote => {
            // Find the corresponding project note
            const matchingNote = notes.find(note => note.name === templateNote.name);
            if (matchingNote) {
              noteValues[templateNote.id] = matchingNote.content || '';
            } else {
              noteValues[templateNote.id] = '';
            }
          });
          
          setTemplateNoteValues(noteValues);
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load project information. Please try again.',
      });
    }
  };

  const resetForm = () => {
    setReportName('');
    setSelectedProjectId('');
  };

  useEffect(() => {
    fetchExistingProjects();
  }, []);

  return {
    existingProjects,
    selectedProjectId,
    reportName,
    setSelectedProjectId,
    setReportName,
    handleProjectSelect,
    resetForm
  };
};
