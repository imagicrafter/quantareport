
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

interface ReportSaveProps {
  reportMode: 'new' | 'update';
  reportName: string;
  templateId?: string;
  selectedProjectId?: string;
  templateNotes?: any[];
  templateNoteValues?: Record<string, string>;
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
  }: ReportSaveProps): Promise<boolean> => {
    if (reportMode === 'new' && (!reportName || !templateId)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a report name and select a template.',
        variant: 'destructive',
      });
      return false;
    }

    if (reportMode === 'update' && !selectedProjectId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a project to update.',
        variant: 'destructive',
      });
      return false;
    }

    setIsSaving(true);

    try {
      let projectId = selectedProjectId;
      
      // For new reports, create a new project
      if (reportMode === 'new') {
        const user = await supabase.auth.getUser();
        
        if (!user.data.user) {
          throw new Error('You must be signed in to create a report');
        }
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: reportName,
            description: 'Created with Report Wizard',
            template_id: templateId,
            user_id: user.data.user.id,
          })
          .select()
          .single();
          
        if (projectError) throw projectError;
        
        projectId = projectData.id;
        
        // Store the templateNotes to database if they exist
        if (templateNotes && templateNotes.length > 0 && templateNoteValues) {
          // Convert templateNoteValues to notes
          const notes = templateNotes.map((noteTemplate) => {
            return {
              project_id: projectId,
              user_id: user.data.user.id,
              title: noteTemplate.title,
              name: noteTemplate.name,
              content: templateNoteValues[noteTemplate.id] || '',
            };
          });
          
          // Insert notes
          const { error: notesError } = await supabase
            .from('notes')
            .insert(notes);
            
          if (notesError) {
            console.error('Error saving template notes:', notesError);
          }
        }
      }
      
      // Store current project ID in localStorage for access between steps
      if (projectId) {
        localStorage.setItem('currentProjectId', projectId);
        console.log('Saved project ID to localStorage:', projectId);
        
        // Navigate to the next step with the project ID in state
        // Use a timeout to ensure the state update completes before navigation
        setTimeout(() => {
          navigate('/dashboard/report-wizard/files', { 
            state: { projectId: projectId },
            replace: false
          });
        }, 100);
      }
      
      toast({
        title: 'Success',
        description: reportMode === 'new' 
          ? 'New report created successfully' 
          : 'Report updated successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Error',
        description: 'Failed to save report. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, saveReport };
};
