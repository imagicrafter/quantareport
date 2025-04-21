import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Template } from '@/types/template.types';
import { loadTemplateNotes } from '@/utils/templateNoteUtils';
import { useNavigate } from 'react-router-dom';

export interface TemplateNote {
  id: string;
  title: string;
  name: string;
  custom_content: string | null;
  position: number | null;
}

export const useTemplateData = (projectId?: string) => {
  const [defaultTemplate, setDefaultTemplate] = useState<Template | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templateNotes, setTemplateNotes] = useState<TemplateNote[]>([]);
  const [templateNoteValues, setTemplateNoteValues] = useState<Record<string, string>>({});
  const [hasFetchedTemplate, setHasFetchedTemplate] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchDefaultTemplate = async () => {
    // Prevent duplicate fetches for the same template
    if (hasFetchedTemplate) return;
    
    try {
      setIsLoading(true);
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }
      
      // Get the user's profile to determine domain_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('domain_id')
        .eq('id', session.user.id)
        .single();
        
      // Fetch the default template for the user's domain
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('is_default', true)
        .eq('domain_id', profileData?.domain_id || null)
        .maybeSingle();
        
      if (templateError) {
        throw templateError;
      }
      
      // If no domain-specific default template is found, try to get a public default template
      if (!templateData) {
        const { data: publicTemplate, error: publicTemplateError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_default', true)
          .eq('is_public', true)
          .maybeSingle();
          
        if (publicTemplateError) {
          throw publicTemplateError;
        }
        
        setDefaultTemplate(publicTemplate);
      } else {
        setDefaultTemplate(templateData);
      }
      
      // Fetch template notes if we have a default template
      if (templateData || defaultTemplate) {
        const templateId = templateData?.id || defaultTemplate?.id;
        
        if (templateId) {
          try {
            const notes = await loadTemplateNotes(templateId);
            console.log('Template notes loaded:', notes);
            
            // Sort notes by position if available
            const sortedNotes = [...notes].sort((a, b) => {
              // Handle null positions by placing them at the end
              if (a.position === null && b.position === null) return 0;
              if (a.position === null) return 1;
              if (b.position === null) return -1;
              return a.position - b.position;
            });
            
            setTemplateNotes(sortedNotes);
            
            // Initialize template note values with the custom_content values if they exist
            const initialValues: Record<string, string> = {};
            sortedNotes.forEach(note => {
              // Pre-populate with custom_content value or empty string
              initialValues[note.id] = note.custom_content || '';
            });
            setTemplateNoteValues(initialValues);
          } catch (notesError) {
            console.error('Error fetching template notes:', notesError);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to load template notes. Please try again.',
            });
          }
        }
      }
      
      setHasFetchedTemplate(true);
    } catch (error) {
      console.error('Error fetching default template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load template information. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplateById = async (templateId: string) => {
    try {
      setIsLoading(true);
      
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (templateError) throw templateError;
      
      setSelectedTemplate(template);
      
      // Load template notes for the selected template
      const notes = await loadTemplateNotes(templateId);
      setTemplateNotes(notes || []);
      
      // Initialize template note values
      const initialValues: Record<string, string> = {};
      notes.forEach(note => {
        initialValues[note.id] = note.custom_content || '';
      });
      setTemplateNoteValues(initialValues);
      
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load template information.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setTemplateNoteValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Initialize template note values based on loaded notes
  const resetTemplateNoteValues = () => {
    const resetValues: Record<string, string> = {};
    templateNotes.forEach(note => {
      resetValues[note.id] = note.custom_content || '';
    });
    setTemplateNoteValues(resetValues);
  };

  useEffect(() => {
    fetchDefaultTemplate();
  }, []);

  return {
    defaultTemplate,
    selectedTemplate,
    isLoading,
    templateNotes,
    templateNoteValues,
    setTemplateNotes,
    setTemplateNoteValues,
    handleInputChange,
    resetTemplateNoteValues,
    fetchDefaultTemplate,
    fetchTemplateById,
  };
};
