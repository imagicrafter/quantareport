
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onProjectDeleted: () => void;
}

const DeleteProjectDialog = ({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName, 
  onProjectDeleted 
}: DeleteProjectDialogProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handleDelete = async () => {
    if (confirmationText !== projectName) {
      toast.error('Project name does not match. Please type the exact name.');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log(`Starting deletion process for project ${projectId}`);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the delete-project edge function
      const { data, error } = await supabase.functions.invoke('delete-project', {
        body: { projectId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete project');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete project');
      }

      console.log(`Successfully deleted project ${projectId}`);
      
      // Show appropriate success message
      if (data.storageWarnings && data.storageWarnings.length > 0) {
        toast('Project deleted, but some storage files may remain', {
          description: 'The project was removed from the database, but some files in storage could not be deleted.'
        });
      } else {
        toast.success('Project deleted successfully');
      }
      
      onProjectDeleted();
      handleClose();
      
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === projectName;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Project
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action cannot be undone. This will permanently delete the project, all associated files, notes, and reports.
            </p>
            <p className="font-medium">
              Project: <span className="font-normal italic">"{projectName}"</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type the project name to confirm deletion:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Enter project name exactly..."
                className="font-mono text-sm"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectDialog;
