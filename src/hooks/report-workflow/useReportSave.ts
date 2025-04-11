
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { WorkflowState } from '@/types/workflow.types';
import { setWorkflowState } from '@/services/workflowService';

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
        
        // Set workflow state to 2 (Files step)
        console.log('Creating workflow state for new project');
        const workflowSuccess = await setWorkflowState(
          projectId, 
          user.data.user.id, 
          2 as WorkflowState
        );
        
        if (!workflowSuccess) {
          console.error('Error creating workflow state');
        } else {
          console.log('Successfully created workflow state with state 2 (Files step)');
        }
        
        // Store the templateNotes to database if they exist
        if (templateNotes && templateNotes.length > 0 && templateNoteValues) {
          console.log('Saving template notes for project');
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
          } else {
            console.log('Template notes saved successfully');
          }
        }
      } else if (reportMode === 'update' && selectedProjectId) {
        console.log('Using existing project with ID:', selectedProjectId);
        
        // Update workflow state to 2 (Files step)
        console.log('Updating workflow state for existing project');
        const workflowSuccess = await setWorkflowState(
          selectedProjectId, 
          user.data.user.id, 
          2 as WorkflowState
        );
        
        if (!workflowSuccess) {
          console.error('Error updating workflow state');
        } else {
          console.log('Successfully updated workflow state to 2 (Files step)');
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
      
      // Navigate to next step with the project ID
      console.log('Navigating to files step with projectId:', projectId);
      navigate('/dashboard/report-wizard/files', { 
        state: { projectId },
        replace: true
      });

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
