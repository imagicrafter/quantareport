
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
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
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Button from '../../ui-elements/Button';
import { FileType } from './FileItem';
import AudioRecorder from './AudioRecorder';

interface AddFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFile: (values: z.infer<typeof formSchema>) => Promise<void>;
  uploading: boolean;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio', 'folder', 'transcription']),
  file: z.any().optional(),
  folderLink: z.string().optional(),
});

const AddFileDialog = ({ isOpen, onClose, onAddFile, uploading }: AddFileDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'image',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onAddFile(values);
    form.reset();
  };

  const handleTranscriptionComplete = (text: string) => {
    form.setValue('description', text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add File</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Type</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <Label htmlFor="image">Image</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="audio" id="audio" />
                        <Label htmlFor="audio">Audio</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="folder" id="folder" />
                        <Label htmlFor="folder">Google Drive Folder</Label>
                      </div>
                      {/* Hidden transcription type - this will be set automatically */}
                      <div className="hidden">
                        <RadioGroupItem value="transcription" id="transcription" />
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('type') === 'audio' && (
              <div className="border-t pt-3">
                <div className="mb-3 text-sm text-muted-foreground">
                  Record audio to automatically transcribe for description:
                </div>
                <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
              </div>
            )}
            
            {form.watch('type') === 'folder' ? (
              <FormField
                control={form.control}
                name="folderLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Drive Folder Link</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste shared Google Drive folder link" {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground mt-1">
                      Make sure the folder is shared and accessible.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              form.watch('type') === 'image' && (
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...fieldProps} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )
            )}
            
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
                Add File
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFileDialog;
