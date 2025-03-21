
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { Template } from "@/types/template.types";
import { z } from "zod";
import { Plus, Info, AlertTriangle, Edit2, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Template name must be at least 2 characters.",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserTemplateEditFormProps {
  currentTemplate: Template | null;
  onSuccess: (updatedTemplate: Template) => void;
  onCancel: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string | null;
}

interface TemplateNote {
  id: string;
  template_id: string;
  note_id: string;
  note?: Note;
  custom_content?: string | null; // New field to store user-edited content
}

const UserTemplateEditForm = ({ 
  currentTemplate, 
  onSuccess, 
  onCancel 
}: UserTemplateEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentTemplateNotes, setParentTemplateNotes] = useState<TemplateNote[]>([]);
  const [userTemplateNotes, setUserTemplateNotes] = useState<TemplateNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingParentNotes, setLoadingParentNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentError, setParentError] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState<string | null>(null);
  const [editedNoteContent, setEditedNoteContent] = useState<string>("");

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
    },
  });

  useEffect(() => {
    if (currentTemplate) {
      console.log("Current template:", currentTemplate);
      loadTemplateNotes(currentTemplate.id);
      
      if (currentTemplate.parent_template_id) {
        console.log("Loading parent template notes for ID:", currentTemplate.parent_template_id);
        loadParentTemplateNotes(currentTemplate.parent_template_id);
      } else {
        console.log("No parent template ID found");
      }
    }
  }, [currentTemplate]);

  const loadTemplateNotes = async (templateId: string) => {
    try {
      setLoadingNotes(true);
      setError(null);
      
      console.log("Loading notes for template ID:", templateId);
      
      const { data, error } = await supabase
        .from('template_notes')
        .select(`
          id,
          template_id,
          note_id,
          custom_content,
          notes:note_id (
            id,
            title,
            content
          )
        `)
        .eq('template_id', templateId);

      if (error) {
        console.error('Error loading template notes:', error);
        setError(`Failed to load notes: ${error.message}`);
        throw error;
      }

      console.log("User template notes data:", data);

      const notesWithDetails = (data || []).map((item) => ({
        id: item.id,
        template_id: item.template_id,
        note_id: item.note_id,
        note: item.notes as Note,
        custom_content: item.custom_content
      }));
      
      setUserTemplateNotes(notesWithDetails);
    } catch (error) {
      console.error('Error loading template notes:', error);
      toast.error('Failed to load template notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadParentTemplateNotes = async (parentTemplateId: string) => {
    try {
      setLoadingParentNotes(true);
      setParentError(null);
      
      console.log("Loading parent template notes for:", parentTemplateId);
      
      // First, directly query for template_notes to see if any exist
      const { data: directNotes, error: directNotesError } = await supabase
        .from('template_notes')
        .select('id, template_id, note_id')
        .eq('template_id', parentTemplateId);
        
      if (directNotesError) {
        console.error('Error directly checking template notes:', directNotesError);
        setParentError(`Failed to check template notes: ${directNotesError.message}`);
      } else {
        console.log("Direct template notes check:", directNotes);
      }
      
      // Fetch the parent template first to verify it exists
      const { data: parentTemplate, error: parentTemplateError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('id', parentTemplateId)
        .single();
        
      if (parentTemplateError) {
        console.error('Error loading parent template:', parentTemplateError);
        setParentError(`Failed to verify parent template: ${parentTemplateError.message}`);
        throw parentTemplateError;
      }
      
      console.log("Parent template verified:", parentTemplate);
      
      // Get all notes from the parent template with the full join
      const { data, error } = await supabase
        .from('template_notes')
        .select(`
          id,
          template_id,
          note_id,
          notes:note_id (
            id,
            title,
            content
          )
        `)
        .eq('template_id', parentTemplateId);

      if (error) {
        console.error('Supabase error loading parent notes:', error);
        setParentError(`Failed to load parent notes: ${error.message}`);
        throw error;
      }

      console.log("Parent template notes data:", data, "Length:", data?.length || 0);

      if (!data || data.length === 0) {
        console.log("No parent template notes found");
        setParentTemplateNotes([]);
        return;
      }

      // Check if notes objects are present
      for (const item of data) {
        if (!item.notes) {
          console.error("Note details missing for note_id:", item.note_id);
        }
      }

      const notesWithDetails = data.map((item) => {
        if (!item.notes) {
          console.warn("Missing note details for note_id:", item.note_id);
        }
        
        return {
          id: item.id,
          template_id: item.template_id,
          note_id: item.note_id,
          note: item.notes as Note
        };
      });
      
      console.log("Processed parent template notes:", notesWithDetails);
      setParentTemplateNotes(notesWithDetails);
    } catch (error) {
      console.error('Error loading parent template notes:', error);
      toast.error('Failed to load parent template notes');
    } finally {
      setLoadingParentNotes(false);
    }
  };

  const addNoteToUserTemplate = async (noteId: string, content: string | null) => {
    if (!currentTemplate) {
      toast.error("Template information is missing");
      return;
    }
    
    const noteAlreadyExists = userTemplateNotes.some(tn => tn.note_id === noteId);
    
    if (noteAlreadyExists) {
      toast.error("This note is already added to your template");
      return;
    }

    try {
      console.log("Adding note to template:", noteId, currentTemplate.id);
      
      const { data, error } = await supabase
        .from('template_notes')
        .insert({
          template_id: currentTemplate.id,
          note_id: noteId,
          custom_content: content // Store the original or edited content
        })
        .select(`
          id,
          template_id,
          note_id,
          custom_content,
          notes:note_id (
            id,
            title,
            content
          )
        `)
        .single();

      if (error) {
        console.error("Error adding note to template:", error);
        toast.error(`Failed to add note: ${error.message}`);
        throw error;
      }

      console.log("Note added successfully:", data);

      const newTemplateNote = {
        id: data.id,
        template_id: data.template_id,
        note_id: data.note_id,
        note: data.notes as Note,
        custom_content: data.custom_content
      };

      setUserTemplateNotes(prev => [...prev, newTemplateNote]);
      toast.success("Note added to your template");
    } catch (error) {
      console.error("Error adding note to template:", error);
      toast.error("Failed to add note to your template");
    }
  };

  const updateNoteContent = async (templateNoteId: string, content: string) => {
    try {
      console.log("Updating template note content:", templateNoteId, content);
      
      const { error } = await supabase
        .from('template_notes')
        .update({ 
          custom_content: content 
        })
        .eq('id', templateNoteId);

      if (error) {
        console.error("Error updating note content:", error);
        toast.error(`Failed to update note: ${error.message}`);
        throw error;
      }

      // Update local state
      setUserTemplateNotes(prev => 
        prev.map(tn => 
          tn.id === templateNoteId 
            ? { ...tn, custom_content: content } 
            : tn
        )
      );
      
      toast.success("Note content updated");
      setIsEditingNote(null);
    } catch (error) {
      console.error("Error updating note content:", error);
      toast.error("Failed to update note content");
    }
  };

  const openNoteEditor = (templateNote: TemplateNote) => {
    // Initialize the editor with custom content if it exists, otherwise use the original note content
    setEditedNoteContent(templateNote.custom_content || templateNote.note?.content || "");
    setIsEditingNote(templateNote.id);
  };

  const cancelEditing = () => {
    setIsEditingNote(null);
    setEditedNoteContent("");
  };

  const onSubmit = async (values: UserFormValues) => {
    if (!currentTemplate) return;
    
    setIsSubmitting(true);
    try {
      const { error, data } = await supabase
        .from("templates")
        .update({ name: values.name })
        .eq("id", currentTemplate.id)
        .select()
        .single();

      if (error) throw error;
      
      // Ensure the updated template includes parent_template_id
      const updatedTemplate: Template = {
        ...currentTemplate,
        ...data,
        // Important: Preserve the parent_template_id
        parent_template_id: data.parent_template_id || currentTemplate.parent_template_id || null
      };
      
      console.log("Updated template with preserved parent ID:", updatedTemplate);
      
      toast.success("Template updated successfully");
      onSuccess(updatedTemplate);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get note IDs already added to the user's template
  const addedNoteIds = userTemplateNotes.map(tn => tn.note_id);

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 my-6"
        >
          <div className="grid grid-cols-1 gap-6">
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

            {currentTemplate?.description && (
              <div className="space-y-2">
                <FormLabel>Description</FormLabel>
                <div className="p-3 bg-gray-50 rounded-md border">
                  {currentTemplate.description}
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium">Your Template Notes</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>These notes will be included when you create projects based on this template.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {loadingNotes ? (
              <div className="text-center py-4">Loading your notes...</div>
            ) : userTemplateNotes.length === 0 ? (
              <div className="text-muted-foreground py-2">
                You haven't added any notes to this template yet.
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {userTemplateNotes.map(templateNote => (
                  <div key={templateNote.id} className="p-3 bg-gray-50 rounded-md border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{templateNote.note?.title}</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openNoteEditor(templateNote)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {templateNote.custom_content || templateNote.note?.content || "No content"}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {currentTemplate?.parent_template_id && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Available Notes from Original Template</h3>
                  <div className="text-xs text-muted-foreground">
                    Parent ID: {currentTemplate.parent_template_id}
                  </div>
                </div>
                
                {parentError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{parentError}</AlertDescription>
                  </Alert>
                )}
                
                {loadingParentNotes ? (
                  <div className="text-center py-4">Loading available notes...</div>
                ) : parentTemplateNotes.length === 0 ? (
                  <Alert variant="default" className="mb-4">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      No notes available from the original template.
                      {currentTemplate.parent_template_id && 
                        ` Parent template ID: ${currentTemplate.parent_template_id}`}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {parentTemplateNotes.map(templateNote => {
                      const isAdded = addedNoteIds.includes(templateNote.note_id);
                      return (
                        <div 
                          key={templateNote.id} 
                          className={`p-3 rounded-md border flex flex-col ${
                            isAdded ? 'bg-gray-100 border-gray-300' : 'bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{templateNote.note?.title}</h4>
                            <Button
                              type="button"
                              size="sm"
                              variant={isAdded ? "outline" : "default"}
                              onClick={() => {
                                if (!isAdded) {
                                  addNoteToUserTemplate(templateNote.note_id, templateNote.note?.content);
                                }
                              }}
                              disabled={isAdded}
                            >
                              {isAdded ? (
                                "Added"
                              ) : (
                                <>
                                  <Plus className="mr-1 h-3 w-3" /> Add
                                </>
                              )}
                            </Button>
                          </div>
                          {templateNote.note?.content && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-4 whitespace-pre-wrap">
                              {templateNote.note.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Note editor dialog */}
      <Dialog open={!!isEditingNote} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Note Content</DialogTitle>
            <DialogDescription>
              Edit the content of this note for your template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={editedNoteContent} 
              onChange={(e) => setEditedNoteContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEditing}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button 
              onClick={() => {
                if (isEditingNote) {
                  updateNoteContent(isEditingNote, editedNoteContent);
                }
              }}
            >
              <Check className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTemplateEditForm;
