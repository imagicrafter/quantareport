
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  description: string | null;
  image_module: string | null;
  report_module: string | null;
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
  image_module: z.string().optional().nullable(),
  report_module: z.string().optional().nullable(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      image_module: "",
      report_module: "",
    },
  });

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
      image_module: template.image_module || "",
      report_module: template.report_module || "",
    });
    setIsEditing(template.id);
    setIsSheetOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!currentTemplate) return;

    try {
      const { error } = await supabase
        .from("templates")
        .update({
          name: values.name,
          description: values.description,
          image_module: values.image_module,
          report_module: values.report_module,
        })
        .eq("id", currentTemplate.id);

      if (error) throw error;

      // Update local state
      const updatedMyTemplates = myTemplates.map((template) =>
        template.id === currentTemplate.id
          ? { ...template, ...values }
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
                        <FormLabel>Image Module Content</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Image module content"
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
                    name="report_module"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Module Content</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Report module content"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
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
