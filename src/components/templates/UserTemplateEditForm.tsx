
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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

// Schema for the simplified form
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

const UserTemplateEditForm = ({ 
  currentTemplate, 
  onSuccess, 
  onCancel 
}: UserTemplateEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: currentTemplate?.name || "",
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    if (!currentTemplate) return;
    
    setIsSubmitting(true);
    try {
      // Only update the name field
      const { error, data } = await supabase
        .from("templates")
        .update({ name: values.name })
        .eq("id", currentTemplate.id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Template updated successfully");
      onSuccess({
        ...currentTemplate,
        ...data
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};

export default UserTemplateEditForm;
