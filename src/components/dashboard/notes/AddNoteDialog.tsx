
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ImageIcon, File } from 'lucide-react';
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
import Button from '@/components/ui-elements/Button';
import FilePicker from './FilePicker';
import AudioRecorder from '../files/AudioRecorder';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<{
    title: string;
    content?: string;
    analysis?: string;
  }, any, undefined>;
  onSubmit: () => void;
  saving: boolean;
  tempNoteId: string | null;
  analyzingImages: boolean;
  relatedFiles: NoteFileRelationshipWithType[];
  onAnalyzeImages: () => void;
  onFileAdded: (newRelationship?: NoteFileRelationshipWithType) => void;
  projectId: string;
  onTranscriptionComplete: (text: string) => void;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  content: z.string().optional(),
  analysis: z.string().optional(),
});

const AddNoteDialog = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  saving,
  tempNoteId,
  analyzingImages,
  relatedFiles,
  onAnalyzeImages,
  onFileAdded,
  projectId,
  onTranscriptionComplete
}: AddNoteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter note title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Content (Optional)</FormLabel>
                      <AudioRecorder onTranscriptionComplete={onTranscriptionComplete} />
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter note content" 
                        className="min-h-[70px]"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="analysis"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Analysis</FormLabel>
                      <Button
                        type="button"
                        onClick={onAnalyzeImages}
                        isLoading={analyzingImages}
                        disabled={!tempNoteId || relatedFiles.length === 0}
                        className="flex items-center gap-1"
                      >
                        <ImageIcon size={16} />
                        <span>Analyze Images</span>
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Analysis content"
                        className="min-h-[100px]"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {tempNoteId && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Related Files</div>
                      <FilePicker
                        projectId={projectId}
                        noteId={tempNoteId}
                        onFileAdded={onFileAdded}
                        relatedFiles={relatedFiles}
                      />
                    </div>
                    
                    {relatedFiles.length > 0 ? (
                      <div className="bg-secondary/30 rounded-md p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 flex items-center justify-center bg-secondary rounded-full">
                            <File size={16} />
                          </div>
                          <span className="text-sm font-medium">
                            {relatedFiles.length} {relatedFiles.length === 1 ? 'file' : 'files'} attached
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-secondary/30 rounded-md p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 flex items-center justify-center bg-secondary rounded-full">
                            <File size={16} />
                          </div>
                          <span className="text-sm font-medium">
                            0 files attached
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
        
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button 
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={onSubmit}
            isLoading={saving}
          >
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteDialog;
