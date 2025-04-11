
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
        
        // Insert workflow state using rpc call to avoid type issues
        console.log('Creating workflow state for new project');
        const { error: workflowError } = await supabase.rpc('insert_project_workflow', {
          p_project_id: projectId,
          p_user_id: user.data.user.id,
          p_workflow_state: 2 // Step 2 in the workflow
        });
        
        if (workflowError) {
          console.error('Error creating workflow state using RPC:', workflowError);
          // Fallback to direct insert if RPC fails (e.g., if RPC doesn't exist yet)
          const { error: directInsertError } = await supabase.rpc('insert_workflow_state', {
            project_id_param: projectId,
            user_id_param: user.data.user.id,
            workflow_state_param: 2
          });
          
          if (directInsertError) {
            console.error('Error with fallback workflow state insertion:', directInsertError);
            // Last resort - raw SQL (executed via edge function would be better, but for now we'll log the error)
            console.error('Could not insert workflow state. Please ensure the project_workflow table exists.');
          } else {
            console.log('Successfully created workflow state with fallback method');
          }
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
        
        // For updating existing projects, use RPC to check and update workflow state
        console.log('Updating workflow state for existing project');
        const { error: updateError } = await supabase.rpc('update_project_workflow', {
          p_project_id: selectedProjectId,
          p_user_id: user.data.user.id,
          p_workflow_state: 2
        });
        
        if (updateError) {
          console.error('Error updating workflow state using RPC:', updateError);
          // Fallback method if RPC isn't available
          console.log('Attempting direct update of workflow state');
          
          // First check if a workflow entry exists for this project
          const { data: existingWorkflow, error: queryError } = await supabase.rpc('get_workflow_state', {
            project_id_param: selectedProjectId
          });
          
          if (queryError || !existingWorkflow || existingWorkflow.length === 0) {
            console.log('No existing workflow found, creating new entry');
            // Insert new workflow entry using direct method
            const { error: insertError } = await supabase.rpc('insert_workflow_state', {
              project_id_param: selectedProjectId,
              user_id_param: user.data.user.id,
              workflow_state_param: 2
            });
            
            if (insertError) {
              console.error('Error creating workflow state:', insertError);
            } else {
              console.log('Successfully created workflow state with state 2');
            }
          } else {
            console.log('Existing workflow found, updating state');
            // Update existing workflow state using direct method
            const { error: directUpdateError } = await supabase.rpc('update_workflow_state', {
              project_id_param: selectedProjectId,
              workflow_state_param: 2
            });
            
            if (directUpdateError) {
              console.error('Error updating workflow state:', directUpdateError);
            } else {
              console.log('Successfully updated workflow state to 2');
            }
          }
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
