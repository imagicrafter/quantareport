
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Template, Profile } from "@/types/template.types";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TemplateTable from "@/components/templates/TemplateTable";
import TemplateSummaryCards from "@/components/templates/TemplateSummaryCards";
import TemplateEditForm from "@/components/templates/TemplateEditForm";
import UserTemplateEditForm from "@/components/templates/UserTemplateEditForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadTemplateNotes } from "@/utils/templateNoteUtils";

const Templates = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [domainTemplates, setDomainTemplates] = useState<Template[]>([]);
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [domains, setDomains] = useState<Record<string, string>>({});
  const [justAddedTemplate, setJustAddedTemplate] = useState<Template | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndTemplates = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          navigate("/signin");
          return;
        }

        console.log("Auth user data:", authData.user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          setFetchError(`Error fetching profile: ${profileError.message}`);
          throw profileError;
        }
        
        setProfile(profileData);
        console.log("User profile:", profileData);
        setIsAdmin(profileData.role === "admin");

        if (profileData.role === "admin") {
          const { data: domainsData, error: domainsError } = await supabase
            .from("domains")
            .select("id, name");
          
          if (domainsError) {
            console.error("Domains error:", domainsError);
            setFetchError(`Error fetching domains: ${domainsError.message}`);
          }
          
          if (domainsData) {
            const domainMap: Record<string, string> = {};
            domainsData.forEach(domain => {
              domainMap[domain.id] = domain.name;
            });
            setDomains(domainMap);
          }
        }

        // Fetch domain templates that are public
        let domainTemplatesQuery = supabase
          .from("templates")
          .select("*")
          .eq("is_public", true);

        if (profileData.role !== "admin") {
          domainTemplatesQuery = domainTemplatesQuery.eq(
            "domain_id",
            profileData.domain_id
          );
        }

        const { data: domainTemplateData, error: domainTemplateError } =
          await domainTemplatesQuery;

        if (domainTemplateError) {
          console.error("Domain templates error:", domainTemplateError);
          setFetchError(`Error fetching domain templates: ${domainTemplateError.message}`);
          throw domainTemplateError;
        }
        
        console.log("Domain templates data:", domainTemplateData);
        
        const domainTemplatesWithParentId = (domainTemplateData || []).map(template => ({
          ...template,
          parent_template_id: template.parent_template_id || null
        }));
        
        setDomainTemplates(domainTemplatesWithParentId);

        // Fetch user's templates
        const { data: myTemplateData, error: myTemplateError } = await supabase
          .from("templates")
          .select("*")
          .eq("user_id", authData.user.id);

        if (myTemplateError) {
          console.error("My templates error:", myTemplateError);
          setFetchError(`Error fetching my templates: ${myTemplateError.message}`);
          throw myTemplateError;
        }
        
        console.log("My templates data:", myTemplateData);
        
        const myTemplatesWithParentId = (myTemplateData || []).map(template => ({
          ...template,
          parent_template_id: template.parent_template_id || null
        }));
        
        setMyTemplates(myTemplatesWithParentId);
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
      console.log("Copying template:", template);
      console.log("Original template parent ID:", template.parent_template_id);
      console.log("Using template ID as parent:", template.id);
      
      // When copying a template, we set the original template ID as the parent_template_id
      const newTemplate = {
        name: `Copy of ${template.name}`,
        description: template.description,
        image_module: template.image_module,
        report_module: template.report_module,
        layout_module: template.layout_module,
        html_module: template.html_module,
        is_public: false,
        domain_id: template.domain_id,
        user_id: profile.id,
        parent_template_id: template.id, // Set the original template as parent
      };

      console.log("New template data with parent_template_id:", newTemplate);

      const { data, error } = await supabase
        .from("templates")
        .insert([newTemplate])
        .select()
        .single();

      if (error) {
        console.error("Error creating template:", error);
        throw error;
      }
      
      console.log("New template created from DB:", data);
      
      // Double check that parent_template_id is preserved in the response
      if (!data.parent_template_id) {
        console.warn("Warning: parent_template_id missing from DB response, adding it back");
      }
      
      // Ensure parent_template_id is preserved
      const completeTemplate: Template = {
        ...data,
        parent_template_id: data.parent_template_id || template.id // Fallback to template.id if missing
      };

      console.log("Complete template with verified parent ID:", completeTemplate);

      // Copy template notes from the parent template
      const templateNotes = await loadTemplateNotes(template.id);
      console.log("Template notes to copy:", templateNotes);
      
      if (templateNotes.length > 0) {
        // Create new template_notes entries for the new template, preserving position values
        const newTemplateNotes = templateNotes.map(note => ({
          template_id: completeTemplate.id,
          title: note.title,
          name: note.name,
          custom_content: note.custom_content,
          position: note.position // Ensure position is copied over
        }));
        
        console.log("Creating new template notes with positions preserved:", newTemplateNotes);
        
        const { error: notesError } = await supabase
          .from("template_notes")
          .insert(newTemplateNotes);
          
        if (notesError) {
          console.error("Error copying template notes:", notesError);
          toast({
            title: "Warning",
            description: "Template was created but there was an error copying template notes.",
            variant: "destructive",
          });
        } else {
          console.log("Successfully copied template notes with positions");
        }
      }

      setMyTemplates(prevTemplates => [...prevTemplates, completeTemplate]);
      toast({
        title: "Success",
        description: "Template added to your collection.",
      });
      
      setJustAddedTemplate(completeTemplate);
      setCurrentTemplate(completeTemplate);
      setIsEditing(completeTemplate.id);
      setIsSheetOpen(true);
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
    console.log("Editing template:", template);
    setCurrentTemplate(template);
    setIsEditing(template.id);
    setIsSheetOpen(true);
  };

  const handleTemplateUpdate = (updatedTemplate: Template) => {
    console.log("Template updated:", updatedTemplate);
    
    const updatedTemplates = myTemplates.map((template) =>
      template.id === updatedTemplate.id ? updatedTemplate : template
    );
    
    setMyTemplates(updatedTemplates);
    setIsEditing(null);
    setIsSheetOpen(false);
    setJustAddedTemplate(null);
  };

  const handleCancelEdit = () => {
    setIsSheetOpen(false);
    setIsEditing(null);
    setJustAddedTemplate(null);
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Templates" toggleSidebar={() => {}} />
      
      <div className="px-4 py-4">
        {fetchError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading templates...</p>
          </div>
        ) : (
          <>
            <TemplateSummaryCards 
              domainTemplates={domainTemplates} 
              myTemplates={myTemplates} 
            />

            <Tabs defaultValue="domain" className="w-full mb-10">
              <TabsList className="mb-4">
                <TabsTrigger value="domain">Domain Templates</TabsTrigger>
                <TabsTrigger value="personal">My Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="domain">
                <TemplateTable 
                  templates={domainTemplates}
                  emptyMessage="No domain templates available"
                  onAction={handleCopyTemplate}
                  actionLabel="Add"
                />
              </TabsContent>

              <TabsContent value="personal">
                <TemplateTable 
                  templates={myTemplates}
                  emptyMessage="No personal templates yet"
                  onAction={handleEditTemplate}
                  actionLabel="Edit"
                />
              </TabsContent>
            </Tabs>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {justAddedTemplate ? "Customize New Template" : "Edit Template"}
                  </SheetTitle>
                  <SheetDescription>
                    {isAdmin ? "Modify template details below" : "Customize your template"}
                  </SheetDescription>
                </SheetHeader>

                {isAdmin ? (
                  <TemplateEditForm 
                    currentTemplate={currentTemplate}
                    onSuccess={handleTemplateUpdate}
                    onCancel={handleCancelEdit}
                    domains={domains}
                  />
                ) : (
                  <UserTemplateEditForm
                    currentTemplate={currentTemplate}
                    onSuccess={handleTemplateUpdate}
                    onCancel={handleCancelEdit}
                  />
                )}
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </div>
  );
};

export default Templates;
