
import { supabase } from '@/integrations/supabase/client';
import { ProjectWorkflow, WorkflowState } from '@/types/workflow.types';

/**
 * Get the active workflow for a user in a specific state
 */
export const getActiveWorkflow = async (userId: string, workflowState: WorkflowState): Promise<ProjectWorkflow | null> => {
  try {
    const { data, error } = await supabase
      .from('project_workflow')
      .select('*')
      .eq('user_id', userId)
      .eq('workflow_state', workflowState)
      .order('last_edited_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching active workflow:', error);
      return null;
    }

    return data as ProjectWorkflow;
  } catch (error) {
    console.error('Error in getActiveWorkflow:', error);
    return null;
  }
};

/**
 * Insert a new workflow state
 */
export const insertWorkflowState = async (
  projectId: string,
  userId: string,
  workflowState: WorkflowState
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('project_workflow')
      .insert({
        project_id: projectId,
        user_id: userId,
        workflow_state: workflowState,
      });

    if (error) {
      console.error('Error inserting workflow state:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in insertWorkflowState:', error);
    return false;
  }
};

/**
 * Update an existing workflow state
 */
export const updateWorkflowState = async (
  projectId: string,
  workflowState: WorkflowState
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('project_workflow')
      .update({ 
        workflow_state: workflowState,
        last_edited_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    if (error) {
      console.error('Error updating workflow state:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWorkflowState:', error);
    return false;
  }
};

/**
 * Set workflow state (create or update)
 */
export const setWorkflowState = async (
  projectId: string,
  userId: string,
  workflowState: WorkflowState
): Promise<boolean> => {
  try {
    // Check if workflow entry exists
    const { data, error } = await supabase
      .from('project_workflow')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error checking workflow state:', error);
      return false;
    }

    if (data) {
      // Update existing workflow state
      return await updateWorkflowState(projectId, workflowState);
    } else {
      // Insert new workflow entry
      return await insertWorkflowState(projectId, userId, workflowState);
    }
  } catch (error) {
    console.error('Error in setWorkflowState:', error);
    return false;
  }
};
