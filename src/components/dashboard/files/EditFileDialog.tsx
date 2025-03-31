
import { useState } from 'react';
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
import { ProjectFile, FileType } from './FileItem';
import AudioRecorder from './AudioRecorder';

interface EditFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditFile: (values: z.infer<typeof formSchema>) => Promise<void>;
  selectedFile: ProjectFile | null;
  uploading: boolean;
}

// Update the form schema to include 'text' as a valid file type
const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio', 'text', 'folder', 'transcription', 'other']),
});

const EditFileDialog = ({ isOpen, onClose, onEditFile, selectedFile, uploading }: EditFileDialogProps) => {
  const [isRecording, setIsRecording] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: selectedFile?.title || '',
      description: selectedFile?.description || '',
      type: (selectedFile?.type as any) || 'image',
    },
  });

  // Update form values when selected file changes
  if (selectedFile && form.getValues('title') !== selectedFile.title) {
    form.reset({
      title: selectedFile.title || selectedFile.name, // Fallback to name if title is not available
      description: selectedFile.description || '',
      type: (selectedFile.type as any),
    });
  }

  const handleTranscriptionComplete = (text: string) => {
    const currentDescription = form.getValues('description') || '';
    const newDescription = currentDescription ? `${currentDescription}\n\n${text}` : text;
    form.setValue('description', newDescription, { shouldValidate: true });
    setIsRecording(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
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
                    <FormLabel>
                      Description (optional)
                      {!isRecording && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRecording(true)}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          Record Audio
                        </Button>
                      )}
                    </FormLabel>
                    {isRecording ? (
                      <div className="mb-4">
                        <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                        <Button 
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsRecording(false)}
                          className="mt-2"
                        >
                          Cancel Recording
                        </Button>
                      </div>
                    ) : (
                      <FormControl>
                        <Textarea 
                          placeholder="Enter description" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button 
            type="button"
            variant="ghost"
            onClick={() => onClose()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={form.handleSubmit(onEditFile)}
            isLoading={uploading}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFileDialog;
