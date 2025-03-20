
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Template } from '@/types/template.types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react'; 
import TemplateEditForm from '@/components/templates/TemplateEditForm';

const TemplatesTab = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadUserProfiles();
    loadDomains();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email');

      if (error) throw error;
      
      const profileMap: Record<string, string> = {};
      (data || []).forEach(profile => {
        profileMap[profile.id] = profile.email || 'Unknown';
      });
      
      setUserProfiles(profileMap);
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };

  const loadDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id, name');

      if (error) throw error;
      
      const domainMap: Record<string, string> = {};
      (data || []).forEach(domain => {
        domainMap[domain.id] = domain.name || 'Unknown';
      });
      
      setDomains(domainMap);
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(false);
  };

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: '',
      name: 'New Template',
      description: '',
      image_module: null,
      report_module: null,
      layout_module: null,
      is_public: false,
      domain_id: null,
      user_id: null,
      created_at: null
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleUpdateSuccess = (updatedTemplate: Template) => {
    if (isCreating) {
      setTemplates(prevTemplates => [updatedTemplate, ...prevTemplates]);
    } else {
      setTemplates(prevTemplates => 
        prevTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
    }
    setEditingTemplate(null);
    setIsCreating(false);
    toast.success(isCreating ? 'Template created successfully' : 'Template updated successfully');
  };

  const getTemplateType = (template: Template) => {
    const types = [];
    if (template.image_module) types.push("Image");
    if (template.report_module) types.push("Report");
    if (template.layout_module) types.push("Layout");
    return types.length > 0 ? types.join(", ") : "—";
  };

  if (editingTemplate) {
    return (
      <div>
        <Button 
          variant="outline" 
          onClick={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }} 
          className="mb-4"
        >
          ← Back to Templates
        </Button>
        <TemplateEditForm 
          currentTemplate={editingTemplate}
          onSuccess={handleUpdateSuccess}
          onCancel={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }}
          isCreating={isCreating}
          domains={domains}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Template Management</h2>
        <Button onClick={handleCreateTemplate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Public</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.name}
                  </TableCell>
                  <TableCell>
                    {template.domain_id ? domains[template.domain_id] || 'Unknown' : '—'}
                  </TableCell>
                  <TableCell>
                    {template.description || '—'}
                  </TableCell>
                  <TableCell>
                    {getTemplateType(template)}
                  </TableCell>
                  <TableCell>
                    {template.user_id ? userProfiles[template.user_id] || 'Unknown' : '—'}
                  </TableCell>
                  <TableCell>
                    {template.is_public ? 'Yes' : 'No'}
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
    </div>
  );
};

export default TemplatesTab;
