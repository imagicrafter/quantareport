
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '../ui-elements/Button';
import NotesSection from './NotesSection';
import FilesSection from './FilesSection';

interface ProjectViewDrawerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

const formSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
  template_id: z.string().min(1, 'Please select a template.'),
  status: z.string().min(1, 'Please select a status.')
});

interface ProjectData {
  name: string;
  template_id: string | null;
  status: string;
}

interface Template {
  id: string;
  name: string;
  is_public: boolean;
  user_id: string | null;
}

const ProjectViewDrawer = ({ open, onClose, projectId }: ProjectViewDrawerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      template_id: '',
      status: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !projectId) return;
      
      setLoading(true);
      try {
        // Fetch project details
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        // Fetch available templates
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          return;
        }

        const userId = session.session.user.id;

        // Modified query: Only fetch templates that belong to the current user
        // (removed the public templates from the query)
        const { data: templateData, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', userId);

        if (templateError) throw templateError;
        setTemplates(templateData || []);

        // Set form values
        form.reset({
          name: project.name,
          template_id: project.template_id || '',
          status: project.status
        });
      } catch (error) {
        console.error('Error fetching project data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, projectId, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: values.name,
          template_id: values.template_id,
          status: values.status
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project updated successfully!',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl flex flex-col h-full p-0">
        <div className="flex-shrink-0 p-6 border-b">
          <SheetHeader className="mb-0">
            <SheetTitle>Project Details</SheetTitle>
          </SheetHeader>
        </div>

        {loading ? (
          <div className="py-8 text-center">Loading project data...</div>
        ) : (
          <Tabs defaultValue="details" className="w-full flex flex-col h-full">
            <div className="flex-shrink-0 px-6 pt-4">
              <TabsList className="mb-4 grid grid-cols-3 w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-grow overflow-y-auto px-6 pb-6">
              <TabsContent value="details" className="mt-0 h-full">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Report Template</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates.length === 0 ? (
                                <SelectItem value="none" disabled>No templates available</SelectItem>
                              ) : (
                                templates.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={saving}
                        className="w-full"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 h-full">
                <NotesSection projectId={projectId} />
              </TabsContent>

              <TabsContent value="files" className="mt-0 h-full">
                <FilesSection projectId={projectId} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ProjectViewDrawer;
