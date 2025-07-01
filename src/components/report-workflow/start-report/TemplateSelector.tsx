
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

        // Get user profile to determine domain
        const { data: profileData } = await supabase
          .from('profiles')
          .select('domain_id')
          .eq('id', session.session.user.id)
          .single();

        let allTemplates: Template[] = [];

        // First, fetch user's personal templates
        const { data: userTemplates, error: userError } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', session.session.user.id);

        if (!userError && userTemplates) {
          allTemplates = [...userTemplates];
        }

        // If user has few personal templates, also include domain templates they can use
        if (allTemplates.length < 3 && profileData?.domain_id) {
          const { data: domainTemplates, error: domainError } = await supabase
            .from('templates')
            .select('*')
            .eq('domain_id', profileData.domain_id)
            .eq('is_public', true)
            .is('user_id', null);

          if (!domainError && domainTemplates) {
            // Add domain templates that aren't already in the list
            const userTemplateIds = new Set(allTemplates.map(t => t.id));
            const newDomainTemplates = domainTemplates.filter(t => !userTemplateIds.has(t.id));
            allTemplates = [...allTemplates, ...newDomainTemplates];
          }
        }

        // If still limited options, include public templates
        if (allTemplates.length < 2) {
          const { data: publicTemplates, error: publicError } = await supabase
            .from('templates')
            .select('*')
            .eq('is_public', true)
            .is('user_id', null)
            .is('domain_id', null);

          if (!publicError && publicTemplates) {
            const existingTemplateIds = new Set(allTemplates.map(t => t.id));
            const newPublicTemplates = publicTemplates.filter(t => !existingTemplateIds.has(t.id));
            allTemplates = [...allTemplates, ...newPublicTemplates];
          }
        }

        setTemplates(allTemplates);

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
              {template.user_id === null && template.domain_id && ' (Domain)'}
              {template.user_id === null && !template.domain_id && ' (Public)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TemplateSelector;
