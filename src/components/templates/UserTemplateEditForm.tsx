
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
import { Template } from "@/types/template.types";
import { z } from "zod";
import { Plus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        note: item.notes as Note
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
      setError(null);
      
      console.log("Loading parent template notes for:", parentTemplateId);
      
      // Get all notes from the parent template
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
        setError(`Failed to load parent notes: ${error.message}`);
        throw error;
      }

      console.log("Parent template notes data:", data);

      if (!data || data.length === 0) {
        console.log("No parent template notes found");
        setParentTemplateNotes([]);
        return;
      }

      const notesWithDetails = data.map((item) => ({
        id: item.id,
        template_id: item.template_id,
        note_id: item.note_id,
        note: item.notes as Note
      }));
      
      setParentTemplateNotes(notesWithDetails);
    } catch (error) {
      console.error('Error loading parent template notes:', error);
      toast.error('Failed to load parent template notes');
    } finally {
      setLoadingParentNotes(false);
    }
  };

  const addNoteToUserTemplate = async (noteId: string) => {
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
          note_id: noteId
        })
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
        note: data.notes as Note
      };

      setUserTemplateNotes(prev => [...prev, newTemplateNote]);
      toast.success("Note added to your template");
    } catch (error) {
      console.error("Error adding note to template:", error);
      toast.error("Failed to add note to your template");
    }
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
        parent_template_id: data.parent_template_id || currentTemplate.parent_template_id || null
      };
      
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
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
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
                    <h4 className="font-medium">{templateNote.note?.title}</h4>
                    {templateNote.note?.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {templateNote.note.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {currentTemplate?.parent_template_id && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Available Notes from Original Template</h3>
                
                {loadingParentNotes ? (
                  <div className="text-center py-4">Loading available notes...</div>
                ) : parentTemplateNotes.length === 0 ? (
                  <div className="text-muted-foreground py-2">
                    No notes available from the original template.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parentTemplateNotes.map(templateNote => {
                      const isAdded = addedNoteIds.includes(templateNote.note_id);
                      return (
                        <div 
                          key={templateNote.id} 
                          className={`p-3 rounded-md border flex justify-between items-center ${
                            isAdded ? 'bg-gray-100 border-gray-300' : 'bg-white'
                          }`}
                        >
                          <div>
                            <h4 className="font-medium">{templateNote.note?.title}</h4>
                            {templateNote.note?.content && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {templateNote.note.content}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={isAdded ? "outline" : "default"}
                            onClick={() => addNoteToUserTemplate(templateNote.note_id)}
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
    </div>
  );
};

export default UserTemplateEditForm;
