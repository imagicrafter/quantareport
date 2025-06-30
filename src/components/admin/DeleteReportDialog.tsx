
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
      
      // Delete the report from the database
      // Reports don't have associated storage folders - files are organized by project_id
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
              This action cannot be undone. This will permanently delete the report from the database.
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
