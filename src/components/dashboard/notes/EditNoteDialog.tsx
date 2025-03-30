
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ImageIcon, File } from 'lucide-react';
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
import { Note } from '@/utils/noteUtils';
import { NoteFormValues } from './hooks/useNotesOperations';

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<NoteFormValues, any, undefined>;
  onSubmit: () => void;
  saving: boolean;
  selectedNote: Note | null;
  analyzingImages: boolean;
  relatedFiles: NoteFileRelationshipWithType[];
  onAnalyzeImages: () => void;
  onFileAdded: () => void;
  projectId: string;
  onTranscriptionComplete: (text: string) => void;
}

const EditNoteDialog = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  saving,
  selectedNote,
  analyzingImages,
  relatedFiles,
  onAnalyzeImages,
  onFileAdded,
  projectId,
  onTranscriptionComplete
}: EditNoteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Edit Note</DialogTitle>
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
                        className="flex items-center gap-1"
                      >
                        <ImageIcon size={16} />
                        <span>Analyze Images</span>
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Analysis content"
                        className="min-h-[200px]"
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedNote && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Related Files</div>
                    <FilePicker 
                      projectId={projectId} 
                      noteId={selectedNote.id}
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNoteDialog;
