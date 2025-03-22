
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Button from '../../ui-elements/Button';
import { ProjectFile } from './FileItem';

interface EditFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditFile: (values: z.infer<typeof formSchema>) => Promise<void>;
  selectedFile: ProjectFile | null;
  uploading: boolean;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio', 'folder', 'transcription']),
});

const EditFileDialog = ({ isOpen, onClose, onEditFile, selectedFile, uploading }: EditFileDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: selectedFile?.name || '',
      description: selectedFile?.description || '',
      type: selectedFile?.type || 'image',
    },
  });

  // Update form values when selected file changes
  if (selectedFile && form.getValues('title') !== selectedFile.name) {
    form.reset({
      title: selectedFile.name,
      description: selectedFile.description || '',
      type: selectedFile.type,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEditFile)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter file title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button"
                variant="ghost"
                onClick={() => onClose()}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                isLoading={uploading}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFileDialog;
