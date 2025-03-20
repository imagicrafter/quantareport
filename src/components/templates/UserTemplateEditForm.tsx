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

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
    },
  });

  useEffect(() => {
    if (currentTemplate) {
      loadTemplateNotes(currentTemplate.id);
      
      if (currentTemplate.parent_template_id) {
        loadParentTemplateNotes(currentTemplate.parent_template_id);
      }
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
          note_id,
          notes:note_id (
            id,
            title,
            content
          )
        `)
        .eq('template_id', templateId);

      if (error) throw error;

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

      if (error) throw error;

      const notesWithDetails = (data || []).map((item) => ({
        id: item.id,
        template_id: item.template_id,
        note_id: item.note_id,
        note: item.notes as Note
      }));
      
      setParentTemplateNotes(notesWithDetails);
    } catch (error) {
      console.error('Error loading parent template notes:', error);
      toast.error('Failed to load parent template notes');
    }
  };

  const addNoteToUserTemplate = async (noteId: string) => {
    if (!currentTemplate) return;
    
    const noteAlreadyExists = userTemplateNotes.some(tn => tn.note_id === noteId);
    
    if (noteAlreadyExists) {
      toast.error("This note is already added to your template");
      return;
    }

    try {
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

      if (error) throw error;

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
              <div className="text-center py-4">Loading notes...</div>
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
            
            {currentTemplate?.parent_template_id && parentTemplateNotes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Available Notes from Original Template</h3>
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
