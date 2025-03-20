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

  useEffect(() => {
    const fetchUserAndTemplates = async () => {
      setIsLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          navigate("/signin");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        setIsAdmin(profileData.role === "admin");

        if (profileData.role === "admin") {
          const { data: domainsData } = await supabase
            .from("domains")
            .select("id, name");
          
          if (domainsData) {
            const domainMap: Record<string, string> = {};
            domainsData.forEach(domain => {
              domainMap[domain.id] = domain.name;
            });
            setDomains(domainMap);
          }
        }

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

        if (domainTemplateError) throw domainTemplateError;
        
        const domainTemplatesWithParentId = (domainTemplateData || []).map(template => ({
          ...template,
          parent_template_id: template.parent_template_id || null
        }));
        
        setDomainTemplates(domainTemplatesWithParentId);

        const { data: myTemplateData, error: myTemplateError } = await supabase
          .from("templates")
          .select("*")
          .eq("user_id", authData.user.id);

        if (myTemplateError) throw myTemplateError;
        
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
      const newTemplate = {
        name: `Copy of ${template.name}`,
        description: template.description,
        image_module: template.image_module,
        report_module: template.report_module,
        layout_module: template.layout_module,
        is_public: false,
        domain_id: template.domain_id,
        user_id: profile.id,
        parent_template_id: template.id,
      };

      const { data, error } = await supabase
        .from("templates")
        .insert([newTemplate])
        .select()
        .single();

      if (error) throw error;
      
      const completeTemplate: Template = {
        ...data,
        parent_template_id: data.parent_template_id || template.id
      };

      setMyTemplates([...myTemplates, completeTemplate]);
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
