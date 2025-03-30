import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { NoteFormValues } from '@/components/dashboard/notes/hooks/useNotesOperations';
import { Note, NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import FilePicker from '@/components/dashboard/notes/FilePicker';
import RelatedFiles from '@/components/dashboard/notes/RelatedFiles';
import AudioRecorder from '../files/AudioRecorder';
import { supabase } from '@/integrations/supabase/client';

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<NoteFormValues>;
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
  onTranscriptionComplete,
}: EditNoteDialogProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (selectedNote) {
      setIsLocked(selectedNote.files_relationships_is_locked || false);
    }
  }, [selectedNote]);

  const handleLockToggle = async (locked: boolean) => {
    if (!selectedNote) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          files_relationships_is_locked: locked
        })
        .eq('id', selectedNote.id);

      if (error) throw error;
      
      setIsLocked(locked);
      toast.success(`Files are now ${locked ? 'locked' : 'unlocked'}`);
    } catch (error) {
      console.error('Error updating lock status:', error);
      toast.error('Failed to update lock status');
      setIsLocked(!locked); // Revert state on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <Form {...form}>
                <form className="space-y-4">
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
                        <FormLabel>
                          Content
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
                            <AudioRecorder onTranscriptionComplete={onTranscriptionComplete} />
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
                              placeholder="Enter note content" 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Related Files</h3>
                  <div className="flex items-center space-x-2">
                    {relatedFiles.some(file => file.file_type === 'image') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={onAnalyzeImages}
                        disabled={analyzingImages}
                      >
                        <Sparkles size={16} />
                        <span>
                          {analyzingImages ? 'Analyzing...' : 'Analyze Images'}
                        </span>
                      </Button>
                    )}
                    <FilePicker
                      projectId={projectId}
                      noteId={selectedNote?.id || ''}
                      onFileAdded={onFileAdded}
                      relatedFiles={relatedFiles}
                      isLocked={isLocked}
                      onLockToggle={handleLockToggle}
                    />
                  </div>
                </div>
                <RelatedFiles files={relatedFiles} />
              </div>

              
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button
            onClick={onSubmit}
            disabled={saving}
            className="ml-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNoteDialog;
