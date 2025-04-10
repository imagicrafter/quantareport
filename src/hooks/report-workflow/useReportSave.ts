
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { TemplateNote } from './useTemplateData';

interface SaveReportProps {
  reportMode: 'new' | 'update';
  reportName: string;
  templateId: string | null;
  selectedProjectId: string;
  templateNotes: TemplateNote[];
  templateNoteValues: Record<string, string>;
}

export const useReportSave = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const saveReport = async ({
    reportMode,
    reportName,
    templateId,
    selectedProjectId,
    templateNotes,
    templateNoteValues
  }: SaveReportProps): Promise<boolean> => {
    try {
      setIsSaving(true);
      
      if (!reportName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a report name.',
        });
        return false;
      }
      
      if (!templateId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No template available. Please contact your administrator.',
        });
        return false;
      }
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return false;
      }
      
      if (reportMode === 'new') {
        // Create new project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: reportName,
            template_id: templateId,
            user_id: session.user.id
          })
          .select('id')
          .single();
          
        if (projectError) {
          throw projectError;
        }
        
        // Create notes for each template note
        const notesPromises = templateNotes
          .filter(note => note.name && templateNoteValues[note.id])
          .map(note => {
            return supabase
              .from('notes')
              .insert({
                project_id: projectData.id,
                user_id: session.user.id,
                title: note.title,
                name: note.name,
                content: templateNoteValues[note.id]
              });
          });
          
        await Promise.all(notesPromises);
        
        toast({
          title: 'Success',
          description: 'Project created successfully!',
        });
        
        // Store the project ID in localStorage for the wizard flow
        localStorage.setItem('currentProjectId', projectData.id);
        
        return true;
      } else {
        // Update existing project
        if (!selectedProjectId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a project to update.',
          });
          return false;
        }
        
        // Update project name if needed
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: reportName })
          .eq('id', selectedProjectId);
          
        if (projectError) {
          throw projectError;
        }
        
        // Update or insert notes
        const { data: existingNotes, error: notesError } = await supabase
          .from('notes')
          .select('id, name')
          .eq('project_id', selectedProjectId);
          
        if (notesError) throw notesError;
        
        // Create a map of existing notes by name
        const existingNotesByName: Record<string, string> = {};
        existingNotes?.forEach(note => {
          if (note.name) {
            existingNotesByName[note.name] = note.id;
          }
        });
        
        // Update or insert notes based on template notes
        const notePromises = templateNotes
          .filter(note => note.name && templateNoteValues[note.id])
          .map(note => {
            const existingNoteId = existingNotesByName[note.name];
            
            if (existingNoteId) {
              // Update existing note
              return supabase
                .from('notes')
                .update({ content: templateNoteValues[note.id] })
                .eq('id', existingNoteId);
            } else {
              // Insert new note
              return supabase
                .from('notes')
                .insert({
                  project_id: selectedProjectId,
                  user_id: session.user.id,
                  title: note.title,
                  name: note.name,
                  content: templateNoteValues[note.id]
                });
            }
          });
          
        await Promise.all(notePromises);
        
        toast({
          title: 'Success',
          description: 'Project updated successfully!',
        });
        
        // Store the project ID in localStorage for the wizard flow
        localStorage.setItem('currentProjectId', selectedProjectId);
        
        return true;
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save project. Please try again.',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveReport
  };
};
