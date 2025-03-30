
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Button from '@/components/ui-elements/Button';

interface DeleteNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  saving: boolean;
}

const DeleteNoteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  saving
}: DeleteNoteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <p>Are you sure you want to delete this note? This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <Button 
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="primary"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            isLoading={saving}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteNoteDialog;
