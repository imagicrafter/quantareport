
import { z } from "zod";

export const formSchema = z.object({
  name: z.string().min(2, {
    message: "Template name must be at least 2 characters.",
  }),
  description: z.string().optional().nullable(),
  image_module: z.string().optional().nullable()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch (e) {
          return false;
        }
      },
      { message: "Invalid JSON format" }
    ),
  report_module: z.string().optional().nullable()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch (e) {
          return false;
        }
      },
      { message: "Invalid JSON format" }
    ),
  layout_module: z.string().optional().nullable()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch (e) {
          return false;
        }
      },
      { message: "Invalid JSON format" }
    ),
});

export type FormValues = z.infer<typeof formSchema>;

// Helper function to format JSON for display
export const formatJsonForDisplay = (jsonData: any): string => {
  if (!jsonData) return "";
  
  try {
    // If it's already a string, check if it's valid JSON
    if (typeof jsonData === 'string') {
      // Try to parse it to validate and format
      const parsed = JSON.parse(jsonData);
      return JSON.stringify(parsed, null, 2);
    }
    
    // If it's an object, stringify it with formatting
    return JSON.stringify(jsonData, null, 2);
  } catch (error) {
    console.error("Error formatting JSON:", error);
    // Return as is if there's an error
    return typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  }
};
