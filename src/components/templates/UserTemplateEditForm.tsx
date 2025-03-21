
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { AlertCircle, Edit, Trash2 } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Template } from "@/types/template.types";
import { formatJsonForDisplay } from "@/utils/templateFormSchema";

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

type FormValues = z.infer<typeof formSchema>;

const UserTemplateEditForm = ({ 
  currentTemplate, 
  onSuccess, 
  onCancel 
}: UserTemplateEditFormProps) => {
  const [templateNotes, setTemplateNotes] = useState<TemplateNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [jsonErrors, setJsonErrors] = useState({
    image_module: false,
    report_module: false,
    layout_module: false,
  });
  const [noteTitle, setNoteTitle] = useState("");
  const [noteName, setNoteName] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
      description: currentTemplate?.description || "",
    },
  });

  useEffect(() => {
    if (currentTemplate?.id) {
      loadTemplateNotes(currentTemplate.id);
    }
  }, [currentTemplate]);

  const loadTemplateNotes = async (templateId: string) => {
    try {
      setLoadingNotes(true);
      
      const { data, error } = await supabase
        .from('template_notes')
        .select(`
          id,
          template_id,
          title,
          name,
          custom_content
        `)
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

  const validateJson = (jsonString: string | null, field: 'image_module' | 'report_module' | 'layout_module'): boolean => {
    if (!jsonString) return true;
    
    try {
      JSON.parse(jsonString);
      setJsonErrors(prev => ({ ...prev, [field]: false }));
      return true;
    } catch (e) {
      setJsonErrors(prev => ({ ...prev, [field]: true }));
      return false;
    }
  };

  const handleEditNote = (noteId: string, content: string | null, title: string, name: string) => {
    setEditingNoteId(noteId);
    setNoteContent(content || "");
    setNoteTitle(title);
    setNoteName(name);
    setNoteDialogOpen(true);
  };

  const saveNoteContent = async () => {
    if (!editingNoteId) return;

    try {
      const { error } = await supabase
        .from('template_notes')
        .update({ 
          custom_content: noteContent,
          title: noteTitle,
          name: noteName
        })
        .eq('id', editingNoteId);

      if (error) throw error;

      setTemplateNotes(prev => 
        prev.map(note => 
          note.id === editingNoteId 
            ? { ...note, custom_content: noteContent, title: noteTitle, name: noteName } 
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

  const addNoteToTemplate = async () => {
    if (!noteTitle.trim() || !noteName.trim() || !currentTemplate?.id) {
      toast.error("Please enter both a title and name for the note");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('template_notes')
        .insert({
          template_id: currentTemplate.id,
          title: noteTitle.trim(),
          name: noteName.trim(),
          custom_content: ""
        })
        .select()
        .single();

      if (error) throw error;

      setTemplateNotes(prev => [...prev, data]);
      setNoteTitle("");
      setNoteName("");
      toast.success("Note added to template");
    } catch (error) {
      console.error("Error adding note to template:", error);
      toast.error("Failed to add note to template");
    }
  };

  const removeNoteFromTemplate = async (templateNoteId: string) => {
    try {
      const { error } = await supabase
        .from('template_notes')
        .delete()
        .eq('id', templateNoteId);

      if (error) throw error;

      setTemplateNotes(prev => prev.filter(tn => tn.id !== templateNoteId));
      toast.success("Note removed from template");
    } catch (error) {
      console.error("Error removing note from template:", error);
      toast.error("Failed to remove note from template");
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

          {/* Template Notes Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">Template Notes</h3>
            
            <div className="space-y-2">
              <Input
                placeholder="Enter note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Enter note name"
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                className="w-full"
              />
              <Button type="button" onClick={addNoteToTemplate} className="w-full">
                Add Note
              </Button>
            </div>
            
            {loadingNotes ? (
              <div className="text-center py-4">Loading notes...</div>
            ) : templateNotes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No notes attached to this template</div>
            ) : (
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
                        onClick={() => handleEditNote(note.id, note.custom_content, note.title, note.name)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeNoteFromTemplate(note.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Read-only JSON Modules */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium">Image Module Content (JSON)</h3>
              <Textarea
                className="font-mono text-sm min-h-[150px] mt-2"
                value={formatJsonForDisplay(currentTemplate?.image_module) || ""}
                readOnly
              />
            </div>

            <div>
              <h3 className="text-base font-medium">Report Module Content (JSON)</h3>
              <Textarea
                className="font-mono text-sm min-h-[150px] mt-2"
                value={formatJsonForDisplay(currentTemplate?.report_module) || ""}
                readOnly
              />
            </div>

            <div>
              <h3 className="text-base font-medium">Layout Module Content (JSON)</h3>
              <Textarea
                className="font-mono text-sm min-h-[150px] mt-2"
                value={formatJsonForDisplay(currentTemplate?.layout_module) || ""}
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel>Note Title</FormLabel>
              <Input 
                value={noteTitle} 
                onChange={(e) => setNoteTitle(e.target.value)} 
                placeholder="Enter note title"
              />
            </div>
            <div className="space-y-2">
              <FormLabel>Note Name</FormLabel>
              <Input 
                value={noteName} 
                onChange={(e) => setNoteName(e.target.value)} 
                placeholder="Enter note name"
              />
            </div>
            <div className="space-y-2">
              <FormLabel>Note Content</FormLabel>
              <Textarea 
                value={noteContent} 
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="Enter note content here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveNoteContent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserTemplateEditForm;
