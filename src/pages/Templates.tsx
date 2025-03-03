
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Template {
  id: string;
  name: string;
  description: string | null;
  image_module: any | null;
  report_module: any | null;
  is_public: boolean | null;
  domain_id: string | null;
  user_id: string | null;
  created_at: string | null;
}

interface Profile {
  id: string;
  email: string;
  role: string;
  domain_id: string | null;
}

const formSchema = z.object({
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
});

type FormValues = z.infer<typeof formSchema>;

const Templates = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [domainTemplates, setDomainTemplates] = useState<Template[]>([]);
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [jsonErrors, setJsonErrors] = useState({
    image_module: false,
    report_module: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      image_module: "",
      report_module: "",
    },
  });

  // Helper function to format JSON for display
  const formatJsonForDisplay = (jsonData: any): string => {
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

  // Fetch user profile and templates
  useEffect(() => {
    const fetchUserAndTemplates = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          navigate("/signin");
          return;
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch domain templates based on role and domain
        let domainTemplatesQuery = supabase
          .from("templates")
          .select("*")
          .eq("is_public", true);

        // If not admin, filter by domain_id
        if (profileData.role !== "admin") {
          domainTemplatesQuery = domainTemplatesQuery.eq(
            "domain_id",
            profileData.domain_id
          );
        }

        const { data: domainTemplateData, error: domainTemplateError } =
          await domainTemplatesQuery;

        if (domainTemplateError) throw domainTemplateError;
        setDomainTemplates(domainTemplateData || []);

        // Fetch user templates
        const { data: myTemplateData, error: myTemplateError } = await supabase
          .from("templates")
          .select("*")
          .eq("user_id", authData.user.id)
          .eq("is_public", false);

        if (myTemplateError) throw myTemplateError;
        setMyTemplates(myTemplateData || []);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast({
          title: "Error",
          description: "Failed to load templates. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndTemplates();
  }, [navigate, toast]);

  const handleCopyTemplate = async (template: Template) => {
    if (!profile) return;

    try {
      const newTemplate = {
        name: template.name,
        description: template.description,
        image_module: template.image_module,
        report_module: template.report_module,
        is_public: false,
        domain_id: template.domain_id,
        user_id: profile.id,
      };

      const { data, error } = await supabase
        .from("templates")
        .insert([newTemplate])
        .select()
        .single();

      if (error) throw error;

      setMyTemplates([...myTemplates, data]);
      toast({
        title: "Success",
        description: "Template added to your collection.",
      });
    } catch (error) {
      console.error("Error copying template:", error);
      toast({
        title: "Error",
        description: "Failed to copy template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: Template) => {
    setCurrentTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || "",
      image_module: formatJsonForDisplay(template.image_module),
      report_module: formatJsonForDisplay(template.report_module),
    });
    setIsEditing(template.id);
    setIsSheetOpen(true);
  };

  const validateJson = (jsonString: string | null, field: 'image_module' | 'report_module'): boolean => {
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

    if (!imageModuleValid || !reportModuleValid) {
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
      };

      const { error } = await supabase
        .from("templates")
        .update(updateData)
        .eq("id", currentTemplate.id);

      if (error) throw error;

      // Update local state with parsed JSON
      const updatedMyTemplates = myTemplates.map((template) =>
        template.id === currentTemplate.id
          ? { 
              ...template, 
              ...values,
              image_module: updateData.image_module,
              report_module: updateData.report_module
            }
          : template
      );
      
      setMyTemplates(updatedMyTemplates);

      toast({
        title: "Success",
        description: "Template updated successfully.",
      });
      setIsEditing(null);
      setIsSheetOpen(false);
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
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">Templates</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading templates...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border shadow">
              <h2 className="text-xl font-semibold mb-2">Domain Templates</h2>
              <p className="text-4xl font-bold">{domainTemplates.length}</p>
              <p className="text-muted-foreground">
                Templates available for your domain
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border shadow">
              <h2 className="text-xl font-semibold mb-2">My Templates</h2>
              <p className="text-4xl font-bold">{myTemplates.length}</p>
              <p className="text-muted-foreground">Your personal templates</p>
            </div>
          </div>

          <Tabs defaultValue="domain" className="w-full mb-10">
            <TabsList className="mb-4">
              <TabsTrigger value="domain">Domain Templates</TabsTrigger>
              <TabsTrigger value="personal">My Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="domain">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domainTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No domain templates available
                        </TableCell>
                      </TableRow>
                    ) : (
                      domainTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            {template.name}
                          </TableCell>
                          <TableCell>{template.description || "—"}</TableCell>
                          <TableCell>
                            {template.image_module ? "Image" : "Report"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleCopyTemplate(template)}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="personal">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No personal templates yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      myTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            {template.name}
                          </TableCell>
                          <TableCell>{template.description || "—"}</TableCell>
                          <TableCell>
                            {template.image_module ? "Image" : "Report"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTemplate(template)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Template</SheetTitle>
                <SheetDescription>
                  Modify your template details below
                </SheetDescription>
              </SheetHeader>

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

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsSheetOpen(false);
                        setIsEditing(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default Templates;
