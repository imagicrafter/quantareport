
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Button from '../../ui-elements/Button';
import { ProjectFile } from './FileItem';

export interface DeleteFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  uploading: boolean;
}

const DeleteFileDialog = ({ isOpen, onClose, onDelete, uploading }: DeleteFileDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete File</DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <p>Are you sure you want to delete this file? This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <Button 
            type="button"
            variant="ghost"
            onClick={() => onClose()}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="primary"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onDelete}
            isLoading={uploading}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteFileDialog;
