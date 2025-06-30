
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
      const deleteStorageFiles = async (bucketName: string) => {
        try {
          console.log(`Attempting to delete files from bucket: ${bucketName} for project: ${projectId}`);
          
          // List all files in the project folder
          const { data: files, error: listError } = await supabase.storage
            .from(bucketName)
            .list(projectId, { 
              limit: 1000,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (listError) {
            console.error(`Error listing files in ${bucketName}/${projectId}:`, listError);
            throw new Error(`Failed to list files in ${bucketName}: ${listError.message}`);
          }

          if (files && files.length > 0) {
            console.log(`Found ${files.length} files in ${bucketName}/${projectId}`);
            
            // Create array of file paths to delete (include the project folder prefix)
            const filePaths = files.map(file => `${projectId}/${file.name}`);
            
            console.log(`Deleting files from ${bucketName}:`, filePaths);
            
            // Delete all files in the folder
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove(filePaths);

            if (deleteError) {
              console.error(`Error deleting files from ${bucketName}:`, deleteError);
              throw new Error(`Failed to delete files from ${bucketName}: ${deleteError.message}`);
            }

            console.log(`Successfully deleted ${filePaths.length} files from ${bucketName}/${projectId}`);
          } else {
            console.log(`No files found in ${bucketName}/${projectId}`);
          }
        } catch (error) {
          console.error(`Error processing ${bucketName} deletion:`, error);
          throw error; // Re-throw to be caught by outer try-catch
        }
      };

      // Delete from both storage buckets - if one fails, we still want to try the other
      const storageErrors = [];
      
      try {
        await deleteStorageFiles('pub_images');
      } catch (error) {
        console.error('Failed to delete from pub_images:', error);
        storageErrors.push(`pub_images: ${error.message}`);
      }

      try {
        await deleteStorageFiles('pub_documents');
      } catch (error) {
        console.error('Failed to delete from pub_documents:', error);
        storageErrors.push(`pub_documents: ${error.message}`);
      }

      // Log storage errors but don't fail the entire operation
      if (storageErrors.length > 0) {
        console.warn('Some storage files could not be deleted:', storageErrors);
        toast('Project deleted, but some storage files may remain', {
          description: 'The project was removed from the database, but some files in storage could not be deleted.'
        });
      }

      // Delete the project from the database
      // This will cascade delete related records (notes, files, reports, etc.) due to foreign key constraints
      console.log(`Deleting project ${projectId} from database`);
      
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
