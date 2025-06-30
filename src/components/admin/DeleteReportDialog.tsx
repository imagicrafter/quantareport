
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

interface DeleteReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  onReportDeleted: () => void;
}

const DeleteReportDialog = ({ 
  isOpen, 
  onClose, 
  reportId, 
  reportTitle, 
  onReportDeleted 
}: DeleteReportDialogProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handleDelete = async () => {
    if (confirmationText !== reportTitle) {
      toast.error('Report title does not match. Please type the exact title.');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log(`Starting deletion process for report ${reportId}`);
      
      // Delete associated files from storage buckets
      const deleteStorageFiles = async (bucketName: string, prefix: string) => {
        try {
          // List files in the report folder
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
        deleteStorageFiles('pub_images', reportId),
        deleteStorageFiles('pub_documents', reportId)
      ]);

      // Delete the report from the database
      const { error: dbError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (dbError) {
        throw new Error(`Failed to delete report from database: ${dbError.message}`);
      }

      console.log(`Successfully deleted report ${reportId} from database`);
      
      toast.success('Report deleted successfully');
      onReportDeleted();
      handleClose();
      
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast.error(error.message || 'Failed to delete report. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === reportTitle;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Report
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action cannot be undone. This will permanently delete the report and all associated files.
            </p>
            <p className="font-medium">
              Report: <span className="font-normal italic">"{reportTitle}"</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type the report title to confirm deletion:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Enter report title exactly..."
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
            {isDeleting ? 'Deleting...' : 'Delete Report'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteReportDialog;
