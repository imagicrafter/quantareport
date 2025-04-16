
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Template } from '@/types/template.types';
import { supabase } from '@/integrations/supabase/client';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string) => void;
}

const TemplateSelector = ({ selectedTemplateId, onTemplateChange }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('domain_id')
          .eq('id', session.session.user.id)
          .single();

        // Fetch templates for user's domain and public templates
        const { data: templatesData, error } = await supabase
          .from('templates')
          .select('*')
          .or(`domain_id.eq.${profileData?.domain_id},is_public.eq.true`);

        if (error) throw error;
        setTemplates(templatesData || []);

      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (isLoading) return <div className="h-10 bg-muted animate-pulse rounded-md" />;

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-left">
        Template
      </label>
      <Select
        value={selectedTemplateId || undefined}
        onValueChange={onTemplateChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TemplateSelector;
