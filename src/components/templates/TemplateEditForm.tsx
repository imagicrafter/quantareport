
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { AlertCircle, PlusCircle, Trash2 } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch"; 
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Template } from "@/types/template.types";
import { formSchema, FormValues, formatJsonForDisplay } from "@/utils/templateFormSchema";

interface TemplateEditFormProps {
  currentTemplate: Template | null;
  onSuccess: (updatedTemplate: Template) => void;
  onCancel: () => void;
  isCreating?: boolean;
  domains?: Record<string, string>;
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

const TemplateEditForm = ({ 
  currentTemplate, 
  onSuccess, 
  onCancel, 
  isCreating = false,
  domains = {}
}: TemplateEditFormProps) => {
  const [jsonErrors, setJsonErrors] = useState({
    image_module: false,
    report_module: false,
    layout_module: false,
  });
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [templateNotes, setTemplateNotes] = useState<TemplateNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [loadingNotes, setLoadingNotes] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
      description: currentTemplate?.description || "",
      image_module: formatJsonForDisplay(currentTemplate?.image_module) || "",
      report_module: formatJsonForDisplay(currentTemplate?.report_module) || "",
      layout_module: formatJsonForDisplay(currentTemplate?.layout_module) || "",
      is_public: currentTemplate?.is_public || false,
      domain_id: currentTemplate?.domain_id || null,
    },
  });

  useEffect(() => {
    if (!isCreating && currentTemplate?.id) {
      loadTemplateNotes(currentTemplate.id);
    }
    loadAvailableNotes();
  }, [currentTemplate, isCreating]);

  const loadTemplateNotes = async (templateId: string) => {
    try {
      setLoadingNotes(true);
      
      // Fetch template notes with note details
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

      // Transform the data to include the note details directly
      const notesWithDetails = (data || []).map((item) => ({
        id: item.id,
        template_id: item.template_id,
        note_id: item.note_id,
        note: item.notes as Note
      }));
      
      setTemplateNotes(notesWithDetails);
    } catch (error) {
      console.error('Error loading template notes:', error);
      toast.error('Failed to load template notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadAvailableNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content')
        .order('title', { ascending: true });

      if (error) throw error;
      setAvailableNotes(data || []);
    } catch (error) {
      console.error('Error loading available notes:', error);
      toast.error('Failed to load available notes');
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

  const onSubmit = async (values: FormValues) => {
    // Validate JSON fields
    const imageModuleValid = validateJson(values.image_module, 'image_module');
    const reportModuleValid = validateJson(values.report_module, 'report_module');
    const layoutModuleValid = validateJson(values.layout_module, 'layout_module');

    if (!imageModuleValid || !reportModuleValid || !layoutModuleValid) {
      toast.error("One or more JSON fields contain invalid JSON. Please correct and try again.");
      return;
    }

    try {
      // Parse JSON strings to objects before saving
      const updateData = {
        name: values.name,
        description: values.description,
        image_module: values.image_module ? JSON.parse(values.image_module) : null,
        report_module: values.report_module ? JSON.parse(values.report_module) : null,
        layout_module: values.layout_module ? JSON.parse(values.layout_module) : null,
        is_public: values.is_public,
        domain_id: values.domain_id || null,
      };

      let templateId: string;
      
      if (isCreating) {
        // Create new template
        const { data, error } = await supabase
          .from("templates")
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
        
        toast.success("Template created successfully");
        onSuccess(data);
      } else if (currentTemplate) {
        // Update existing template
        const { error, data } = await supabase
          .from("templates")
          .update(updateData)
          .eq("id", currentTemplate.id)
          .select()
          .single();

        if (error) throw error;
        templateId = currentTemplate.id;
        
        toast.success("Template updated successfully");
        onSuccess({
          ...currentTemplate,
          ...data
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    }
  };

  const addNoteToTemplate = async () => {
    if (!selectedNoteId || !currentTemplate?.id) {
      toast.error("Please select a note to add");
      return;
    }

    // Check if this note is already associated with the template
    const noteAlreadyExists = templateNotes.some(tn => tn.note_id === selectedNoteId);
    
    if (noteAlreadyExists) {
      toast.error("This note is already associated with the template");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('template_notes')
        .insert({
          template_id: currentTemplate.id,
          note_id: selectedNoteId
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

      // Add the new note to the list
      const newTemplateNote = {
        id: data.id,
        template_id: data.template_id,
        note_id: data.note_id,
        note: data.notes as Note
      };

      setTemplateNotes(prev => [...prev, newTemplateNote]);
      setSelectedNoteId("");
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

      // Remove the note from the list
      setTemplateNotes(prev => prev.filter(tn => tn.id !== templateNoteId));
      toast.success("Note removed from template");
    } catch (error) {
      console.error("Error removing note from template:", error);
      toast.error("Failed to remove note from template");
    }
  };

  const domainOptions = Object.entries(domains).map(([id, name]) => ({ 
    value: id, 
    label: name 
  }));

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 my-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <FormField
              control={form.control}
              name="domain_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a domain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {domainOptions.map(domain => (
                        <SelectItem key={domain.value} value={domain.value}>
                          {domain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a domain for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Template</FormLabel>
                    <FormDescription>
                      Make this template available to all users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            {!isCreating && currentTemplate?.id && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-medium">Template Notes</h3>
                
                <div className="flex gap-2">
                  <Select value={selectedNoteId || ""} onValueChange={setSelectedNoteId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a note to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNotes.map(note => (
                        <SelectItem key={note.id} value={note.id}>
                          {note.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addNoteToTemplate}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                
                {loadingNotes ? (
                  <div className="text-center py-4">Loading notes...</div>
                ) : templateNotes.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No notes attached to this template</div>
                ) : (
                  <div className="space-y-2">
                    {templateNotes.map(templateNote => (
                      <div key={templateNote.id} className="flex items-center justify-between rounded-md border p-2">
                        <span className="font-medium">{templateNote.note?.title || 'Unknown Note'}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeNoteFromTemplate(templateNote.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="image_module"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Module Content (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  className="font-mono text-sm min-h-[150px]"
                  placeholder="{}"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    validateJson(e.target.value, 'image_module');
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter valid JSON for the image module
              </FormDescription>
              <FormMessage />
              {jsonErrors.image_module && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid JSON</AlertTitle>
                  <AlertDescription>
                    The JSON format is invalid. Please check for missing commas, brackets, or quotes.
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="report_module"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Module Content (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  className="font-mono text-sm min-h-[150px]"
                  placeholder="{}"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    validateJson(e.target.value, 'report_module');
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter valid JSON for the report module
              </FormDescription>
              <FormMessage />
              {jsonErrors.report_module && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid JSON</AlertTitle>
                  <AlertDescription>
                    The JSON format is invalid. Please check for missing commas, brackets, or quotes.
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="layout_module"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout Module Content (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  className="font-mono text-sm min-h-[150px]"
                  placeholder="{}"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    validateJson(e.target.value, 'layout_module');
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter valid JSON for the layout configuration
              </FormDescription>
              <FormMessage />
              {jsonErrors.layout_module && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid JSON</AlertTitle>
                  <AlertDescription>
                    The JSON format is invalid. Please check for missing commas, brackets, or quotes.
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">{isCreating ? 'Create Template' : 'Save Changes'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default TemplateEditForm;
