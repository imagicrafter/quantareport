
// Update import to include titleToCamelCase from noteUtils
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Template } from "@/types/template.types";
import { titleToCamelCase } from "@/utils/noteUtils";
import { 
  loadTemplateNotes, 
  addNoteToTemplate, 
  updateTemplateNote, 
  removeNoteFromTemplate 
} from "@/utils/templateNoteUtils";

interface TemplateNote {
  id: string;
  template_id: string;
  title: string;
  name: string;
  custom_content: string | null;
}

interface UserTemplateEditFormProps {
  currentTemplate: Template | null;
  onSuccess: (updatedTemplate: Template) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type NoteFormValues = z.infer<typeof noteFormSchema>;

const UserTemplateEditForm = ({ 
  currentTemplate, 
  onSuccess, 
  onCancel 
}: UserTemplateEditFormProps) => {
  const [templateNotes, setTemplateNotes] = useState<TemplateNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
      description: currentTemplate?.description || "",
    },
  });
  
  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (currentTemplate?.id) {
      fetchTemplateNotes(currentTemplate.id);
    }
  }, [currentTemplate]);

  const fetchTemplateNotes = async (templateId: string) => {
    try {
      setLoadingNotes(true);
      
      // Only load notes that belong directly to this template
      const { data, error } = await supabase
        .from('template_notes')
        .select('*')
        .eq('template_id', templateId);
        
      if (error) throw error;
      
      setTemplateNotes(data || []);
    } catch (error) {
      console.error('Error loading template notes:', error);
      toast.error('Failed to load template notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !currentTemplate?.id) {
      toast.error("Please enter a title for the note");
      return;
    }

    try {
      // Convert the title to camelCase for the name
      const name = titleToCamelCase(noteTitle);
      
      const newNote = await addNoteToTemplate(
        currentTemplate.id,
        noteTitle.trim(),
        name
      );

      setTemplateNotes(prev => [...prev, newNote]);
      setNoteTitle("");
      toast.success("Note added to template");
    } catch (error) {
      console.error("Error adding note to template:", error);
      toast.error("Failed to add note to template");
    }
  };

  const handleEditNote = (noteId: string, content: string | null, title: string) => {
    setEditingNoteId(noteId);
    
    // Reset the form with the note values
    noteForm.reset({
      title: title,
      content: content || "",
    });
    
    setNoteDialogOpen(true);
  };

  const saveNoteContent = async (values: NoteFormValues) => {
    if (!editingNoteId) return;

    try {
      await updateTemplateNote(editingNoteId, { 
        custom_content: values.content,
        title: values.title
        // Not updating the name to preserve the camelCase format
      });

      setTemplateNotes(prev => 
        prev.map(note => 
          note.id === editingNoteId 
            ? { ...note, custom_content: values.content, title: values.title } 
            : note
        )
      );
      
      setNoteDialogOpen(false);
      toast.success("Note updated successfully");
    } catch (error) {
      console.error("Error updating note content:", error);
      toast.error("Failed to update note content");
    }
  };

  const handleRemoveNote = async (templateNoteId: string) => {
    try {
      await removeNoteFromTemplate(templateNoteId);
      setTemplateNotes(prev => prev.filter(tn => tn.id !== templateNoteId));
      toast.success("Note removed from template");
    } catch (error) {
      console.error("Error removing note from template:", error);
      toast.error("Failed to remove note from template");
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!currentTemplate) return;

    try {
      // Only update the name and description fields
      const updateData = {
        name: values.name,
        description: values.description || null,
      };

      const { error, data } = await supabase
        .from("templates")
        .update(updateData)
        .eq("id", currentTemplate.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedTemplate: Template = {
        ...currentTemplate,
        ...data,
      };
      
      toast.success("Template updated successfully");
      onSuccess(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template. Please try again.");
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 my-6"
        >
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Template name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Template description"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Template Notes Section with MaxHeight ScrollArea */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">Template Notes</h3>
            
            <div className="space-y-2">
              <Input
                placeholder="Enter note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full"
              />
              <Button type="button" onClick={handleAddNote} className="w-full">
                Add Note
              </Button>
            </div>
            
            {loadingNotes ? (
              <div className="text-center py-4">Loading notes...</div>
            ) : templateNotes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No notes attached to this template</div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {templateNotes.map(note => (
                    <div key={note.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{note.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {note.custom_content ? 
                            (note.custom_content.length > 50 
                              ? note.custom_content.substring(0, 50) + '...' 
                              : note.custom_content) 
                            : 'No content'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditNote(note.id, note.custom_content, note.title)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4 sticky bottom-0 bg-background pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Form>

      {/* Note Edit Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          <Form {...noteForm}>
            <form onSubmit={noteForm.handleSubmit(saveNoteContent)} className="space-y-4 py-4">
              <FormField
                control={noteForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter note title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={noteForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[200px]"
                        placeholder="Enter note content here..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserTemplateEditForm;
