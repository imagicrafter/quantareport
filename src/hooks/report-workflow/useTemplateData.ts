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
    if (hasFetchedTemplate && defaultTemplate) return;
    
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
        
      console.log('User profile data:', profileData);
      
      let templateData = null;
      
      // First, try to find a user-specific default template
      if (profileData?.domain_id) {
        console.log('Looking for user-specific default template...');
        const { data: userDefaultTemplate, error: userTemplateError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_default', true)
          .eq('domain_id', profileData.domain_id)
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (userTemplateError) {
          console.error('Error fetching user-specific default template:', userTemplateError);
        } else if (userDefaultTemplate) {
          console.log('Found user-specific default template:', userDefaultTemplate);
          templateData = userDefaultTemplate;
        }
      }
      
      // If no user-specific template, try domain-specific default
      if (!templateData && profileData?.domain_id) {
        console.log('Looking for domain-specific default template...');
        const { data: domainDefaultTemplate, error: domainTemplateError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_default', true)
          .eq('domain_id', profileData.domain_id)
          .is('user_id', null)
          .maybeSingle();
          
        if (domainTemplateError) {
          console.error('Error fetching domain-specific default template:', domainTemplateError);
        } else if (domainDefaultTemplate) {
          console.log('Found domain-specific default template:', domainDefaultTemplate);
          templateData = domainDefaultTemplate;
        }
      }
      
      // If still no template, try public default template
      if (!templateData) {
        console.log('Looking for public default template...');
        const { data: publicTemplate, error: publicTemplateError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_default', true)
          .eq('is_public', true)
          .is('user_id', null)
          .maybeSingle();
          
        if (publicTemplateError) {
          console.error('Error fetching public default template:', publicTemplateError);
        } else if (publicTemplate) {
          console.log('Found public default template:', publicTemplate);
          templateData = publicTemplate;
        }
      }
      
      // If we still don't have a template, get the first available template for the user's domain
      if (!templateData && profileData?.domain_id) {
        console.log('Looking for any available template in domain...');
        const { data: fallbackTemplate, error: fallbackError } = await supabase
          .from('templates')
          .select('*')
          .eq('domain_id', profileData.domain_id)
          .limit(1)
          .maybeSingle();
          
        if (fallbackError) {
          console.error('Error fetching fallback template:', fallbackError);
        } else if (fallbackTemplate) {
          console.log('Found fallback template:', fallbackTemplate);
          templateData = fallbackTemplate;
        }
      }
      
      if (!templateData) {
        console.warn('No template found for user');
        toast({
          variant: 'destructive',
          title: 'No Template Available',
          description: 'No default template could be found. Please contact your administrator.',
        });
        return;
      }
      
      setDefaultTemplate(templateData);
      
      // Reset selected template when fetching default
      setSelectedTemplate(null);
      
      // Fetch template notes if we have a template
      if (templateData.id) {
        try {
          const notes = await loadTemplateNotes(templateData.id);
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
      
      // Store the selected template
      setSelectedTemplate(template);
      
      // Load template notes for the selected template
      const notes = await loadTemplateNotes(templateId);
      
      // Sort notes by position if available
      const sortedNotes = [...notes].sort((a, b) => {
        // Handle null positions by placing them at the end
        if (a.position === null && b.position === null) return 0;
        if (a.position === null) return 1;
        if (b.position === null) return -1;
        return a.position - b.position;
      });
      
      setTemplateNotes(sortedNotes);
      
      // Initialize template note values
      const initialValues: Record<string, string> = {};
      sortedNotes.forEach(note => {
        initialValues[note.id] = note.custom_content || '';
      });
      setTemplateNoteValues(initialValues);
      
      console.log('Selected template:', template.name, 'with', sortedNotes.length, 'notes');
      
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
