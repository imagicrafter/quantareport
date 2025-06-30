
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
      
      // Delete associated files from storage buckets
      const deleteStorageFiles = async (bucketName: string, prefix: string) => {
        try {
          // List files in the project folder
          const { data: files, error: listError } = await supabase.storage
            .from(bucketName)
            .list(prefix, { limit: 1000 });

          if (listError) {
            console.warn(`Error listing files in ${bucketName}/${prefix}:`, listError);
            return;
          }

          if (files && files.length > 0) {
            // Create array of file paths to delete
            const filePaths = files.map(file => `${prefix}/${file.name}`);
            
            // Delete all files in the folder
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove(filePaths);

            if (deleteError) {
              console.warn(`Error deleting files from ${bucketName}:`, deleteError);
            } else {
              console.log(`Successfully deleted ${filePaths.length} files from ${bucketName}/${prefix}`);
            }
          }
        } catch (error) {
          console.warn(`Error processing ${bucketName} deletion:`, error);
        }
      };

      // Delete from both storage buckets
      await Promise.all([
        deleteStorageFiles('pub_images', projectId),
        deleteStorageFiles('pub_documents', projectId)
      ]);

      // Delete the project from the database
      // This will cascade delete related records (notes, files, reports, etc.) due to foreign key constraints
      const { error: dbError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (dbError) {
        throw new Error(`Failed to delete project from database: ${dbError.message}`);
      }

      console.log(`Successfully deleted project ${projectId} from database`);
      
      toast.success('Project deleted successfully');
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
