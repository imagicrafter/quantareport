
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TemplateNote {
  id: string;
  title: string;
  name: string;
  custom_content: string | null;
  position: number | null;
}

interface ReportSaveProps {
  reportMode: 'new' | 'update';
  reportName: string;
  templateId?: string;
  selectedProjectId?: string;
  templateNotes?: TemplateNote[];
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
    console.log('Starting report save operation...', { reportMode, reportName, templateId, selectedProjectId });

    try {
      let projectId = selectedProjectId;
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        throw new Error('You must be signed in to create a report');
      }
      
      // For new reports, create a new project
      if (reportMode === 'new') {
        console.log('Creating new project in the database');
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
          
        if (projectError) {
          console.error('Error creating project:', projectError);
          throw projectError;
        }
        
        projectId = projectData.id;
        console.log('New project created with ID:', projectId);
        
        // Store the templateNotes to database if they exist
        if (templateNotes && templateNotes.length > 0 && templateNoteValues) {
          console.log('Saving template notes for project with positions:', templateNotes);
          // Convert templateNoteValues to notes, preserving position values
          const notes = templateNotes.map((noteTemplate) => {
            return {
              project_id: projectId,
              user_id: user.data.user.id,
              title: noteTemplate.title,
              name: noteTemplate.name,
              content: templateNoteValues[noteTemplate.id] || '',
              position: noteTemplate.position, // Ensure position is properly copied over
            };
          });
          
          // Insert notes
          const { error: notesError } = await supabase
            .from('notes')
            .insert(notes);
            
          if (notesError) {
            console.error('Error saving template notes:', notesError);
          } else {
            console.log('Template notes saved successfully with positions');
          }
        }
      }
      
      // Ensure we have a valid project ID before proceeding
      if (!projectId) {
        console.error('No project ID available after save operation');
        toast({
          title: 'Error',
          description: 'Failed to get project ID. Please try again.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return false;
      }
      
      // Insert or update workflow state to 2 (Files step)
      console.log('Updating workflow state for project with ID:', projectId);
      
      // Check if a workflow entry exists for this project and user
      const { data: existingWorkflow, error: queryError } = await supabase
        .from('project_workflow')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.data.user.id)
        .limit(1);
        
      if (queryError) {
        console.error('Error checking for existing workflow:', queryError);
      }
      
      if (!existingWorkflow || existingWorkflow.length === 0) {
        // No existing workflow found, insert new one
        console.log('No existing workflow found, creating new entry with workflow_state = 2');
        const { error: insertError } = await supabase
          .from('project_workflow')
          .insert({
            project_id: projectId,
            user_id: user.data.user.id,
            workflow_state: 2,
            last_edited_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating workflow state:', insertError);
          throw insertError;
        } else {
          console.log('Successfully created workflow state with state 2');
        }
      } else {
        // Update existing workflow
        console.log('Existing workflow found, updating state to 2 (Files step)');
        const { error: updateError } = await supabase
          .from('project_workflow')
          .update({ 
            workflow_state: 2,
            last_edited_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .eq('user_id', user.data.user.id);
        
        if (updateError) {
          console.error('Error updating workflow state:', updateError);
          throw updateError;
        } else {
          console.log('Successfully updated workflow state to 2');
        }
      }
      
      // Navigate to the files step
      navigate('/dashboard/report-wizard/files');
      
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
      setIsSaving(false);
      return false;
    }
  };

  return { isSaving, saveReport };
};
