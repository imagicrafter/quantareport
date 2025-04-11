
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface ExitWorkflowDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  projectId: string | null;
  projectName: string;
  targetPath: string;
}

const ExitWorkflowDialog: React.FC<ExitWorkflowDialogProps> = ({
  isOpen,
  setIsOpen,
  projectId,
  projectName,
  targetPath,
}) => {
  const navigate = useNavigate();

  const handleContinue = async () => {
    try {
      // Only reset workflow state if we have a project ID
      if (projectId) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setIsOpen(false);
          navigate(targetPath);
          return;
        }

        // Reset workflow state to 0 (no active workflow)
        await supabase
          .from('project_workflow')
          .update({ 
            workflow_state: 0,
            last_edited_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .eq('user_id', userData.user.id);
        
        console.log(`Workflow state reset to 0 for project ${projectId}`);
      }
      
      // Close dialog and navigate
      setIsOpen(false);
      navigate(targetPath);
    } catch (error) {
      console.error('Error resetting workflow state:', error);
      // Navigate anyway even if there's an error
      setIsOpen(false);
      navigate(targetPath);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit Report Creation?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to leave the Create Report workflow for "{projectName || 'Untitled Report'}". 
            Your progress will be saved, but you'll need to start the workflow from the beginning when you return.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>Yes, Exit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExitWorkflowDialog;
