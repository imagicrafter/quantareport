
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '../ui-elements/Button';

interface CreateProjectModalProps {
  showCreateProject: boolean;
  setShowCreateProject: (show: boolean) => void;
  onProjectCreated?: () => void;
}

interface TemplateNote {
  id: string;
  template_id: string;
  note_id: string;
  custom_content: string | null;
  note: {
    id: string;
    title: string;
    content: string | null;
  };
}

const formSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
  template_id: z.string().min(1, 'Please select a template.')
});

const CreateProjectModal = ({ 
  showCreateProject, 
  setShowCreateProject,
  onProjectCreated
}: CreateProjectModalProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      template_id: ''
    }
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          return;
        }

        // Get only user's templates (not all public templates)
        const { data: userTemplates, error: userError } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', session.session.user.id);

        if (userError) throw userError;
        setTemplates(userTemplates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load templates. Please try again.',
          variant: 'destructive',
        });
      }
    };

    if (showCreateProject) {
      fetchTemplates();
    }
  }, [showCreateProject, toast]);

  // New function to create notes from template notes
  const createNotesFromTemplate = async (templateId: string, projectId: string, userId: string) => {
    try {
      // Get the template notes with their custom content
      const { data: templateNotes, error: templateNotesError } = await supabase
        .from('template_notes')
        .select(`
          id,
          template_id,
          note_id,
          custom_content,
          notes:note_id (
            id,
            title,
            content
          )
        `)
        .eq('template_id', templateId);

      if (templateNotesError) {
        console.error('Error fetching template notes:', templateNotesError);
        throw templateNotesError;
      }

      if (!templateNotes || templateNotes.length === 0) {
        console.log('No template notes found for this template');
        return;
      }

      console.log('Template notes found:', templateNotes);
      
      // Create new notes for the project based on template notes
      const notesToCreate = templateNotes.map((tn: any) => ({
        title: tn.notes.title,
        content: tn.custom_content !== null ? tn.custom_content : tn.notes.content,
        project_id: projectId,
        user_id: userId
      }));

      if (notesToCreate.length > 0) {
        const { data: newNotes, error: createNotesError } = await supabase
          .from('notes')
          .insert(notesToCreate)
          .select();

        if (createNotesError) {
          console.error('Error creating notes from template:', createNotesError);
          throw createNotesError;
        }

        console.log('Created notes from template:', newNotes);
      }
    } catch (error) {
      console.error('Error processing template notes:', error);
      // We don't want to fail project creation if notes can't be created
      toast({
        title: 'Warning',
        description: 'Project created, but there was an issue creating notes from the template.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a project.',
          variant: 'destructive',
        });
        return;
      }

      const userId = session.session.user.id;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: values.name,
          user_id: userId,
          template_id: values.template_id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // After project is created, create notes from template notes
      await createNotesFromTemplate(values.template_id, data.id, userId);

      toast({
        title: 'Success',
        description: 'Project created successfully!',
      });

      form.reset();
      setShowCreateProject(false);
      
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showCreateProject) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <button 
            onClick={() => setShowCreateProject(false)}
            className="p-1 rounded-full hover:bg-secondary/70"
          >
            <X size={20} />
          </button>
        </div>
        
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
                    defaultValue={field.value}
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
            
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateProject(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
