
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
    setIsEditing(template.id);
    setIsSheetOpen(true);
  };

  const handleTemplateUpdate = (updatedTemplate: Template) => {
    const updatedTemplates = myTemplates.map((template) =>
      template.id === updatedTemplate.id ? updatedTemplate : template
    );
    
    setMyTemplates(updatedTemplates);
    setIsEditing(null);
    setIsSheetOpen(false);
  };

  const handleCancelEdit = () => {
    setIsSheetOpen(false);
    setIsEditing(null);
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Templates" toggleSidebar={() => {}} />
      
      <div className="px-4 py-4">
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
                  <SheetTitle>Edit Template</SheetTitle>
                  <SheetDescription>
                    Modify your template details below
                  </SheetDescription>
                </SheetHeader>

                <TemplateEditForm 
                  currentTemplate={currentTemplate}
                  onSuccess={handleTemplateUpdate}
                  onCancel={handleCancelEdit}
                />
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </div>
  );
};

export default Templates;
