
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { Template } from "@/types/template.types";
import { formSchema, FormValues, formatJsonForDisplay } from "@/utils/templateFormSchema";

interface TemplateEditFormProps {
  currentTemplate: Template | null;
  onSuccess: (updatedTemplate: Template) => void;
  onCancel: () => void;
}

const TemplateEditForm = ({ currentTemplate, onSuccess, onCancel }: TemplateEditFormProps) => {
  const { toast } = useToast();
  const [jsonErrors, setJsonErrors] = useState({
    image_module: false,
    report_module: false,
    layout_module: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
      description: currentTemplate?.description || "",
      image_module: formatJsonForDisplay(currentTemplate?.image_module) || "",
      report_module: formatJsonForDisplay(currentTemplate?.report_module) || "",
      layout_module: formatJsonForDisplay(currentTemplate?.layout_module) || "",
    },
  });

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
    if (!currentTemplate) return;

    // Validate JSON fields
    const imageModuleValid = validateJson(values.image_module, 'image_module');
    const reportModuleValid = validateJson(values.report_module, 'report_module');
    const layoutModuleValid = validateJson(values.layout_module, 'layout_module');

    if (!imageModuleValid || !reportModuleValid || !layoutModuleValid) {
      toast({
        title: "Validation Error",
        description: "One or more JSON fields contain invalid JSON. Please correct and try again.",
        variant: "destructive",
      });
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
      };

      const { error, data } = await supabase
        .from("templates")
        .update(updateData)
        .eq("id", currentTemplate.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template updated successfully.",
      });
      
      onSuccess({
        ...currentTemplate,
        ...data
      });
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 my-6"
      >
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
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
};

export default TemplateEditForm;
