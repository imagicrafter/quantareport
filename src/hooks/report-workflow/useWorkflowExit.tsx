import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UseWorkflowExitProps {
  projectId: string | null;
  projectName?: string | null;
  isInWorkflow: boolean;
}

export const useWorkflowExit = ({ projectId, projectName, isInWorkflow }: UseWorkflowExitProps) => {
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [exitDestination, setExitDestination] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const resetWorkflowState = async () => {
    if (!projectId) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Set workflow state to 0 to indicate the workflow has been exited
      const { error } = await supabase
        .from('project_workflow')
        .update({ 
          workflow_state: 0,
          last_edited_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('user_id', userData.user.id);
        
      if (error) {
        console.error('Error resetting workflow state:', error);
      } else {
        console.log('Successfully reset workflow state to 0');
      }
    } catch (error) {
      console.error('Error in resetWorkflowState:', error);
    }
  };

  const handleExitAttempt = (destination: string) => {
    if (!isInWorkflow || !projectId) {
      // If not in workflow or no project, just navigate
      navigate(destination);
      return;
    }
    
    // Otherwise open the confirmation dialog
    setExitDestination(destination);
    setIsExitDialogOpen(true);
  };

  const confirmExit = async () => {
    // Reset workflow state before navigating
    await resetWorkflowState();
    
    setIsExitDialogOpen(false);
    
    if (exitDestination) {
      toast({
        title: "Workflow Exited",
        description: "You've exited the report creation workflow.",
      });
      navigate(exitDestination);
    }
  };

  const cancelExit = () => {
    setIsExitDialogOpen(false);
    setExitDestination(null);
  };

  return {
    isExitDialogOpen,
    exitDestination,
    handleExitAttempt,
    confirmExit,
    cancelExit
  };
};
