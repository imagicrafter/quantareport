
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import StepBanner from '@/components/report-workflow/StepBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import TemplateNotesForm from '@/components/report-workflow/TemplateNotesForm';
import { loadTemplateNotes } from '@/utils/templateNoteUtils';

const StartNewReport = () => {
  const [reportName, setReportName] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templateNotes, setTemplateNotes] = useState<any[]>([]);
  const [templateNoteValues, setTemplateNoteValues] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      try {
        setIsLoading(true);
        
        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/signin');
          return;
        }
        
        // Get the user's profile to determine domain_id
        const { data: profileData } = await supabase
          .from('profiles')
          .select('domain_id')
          .eq('id', session.user.id)
          .single();
          
        // Fetch the default template for the user's domain
        const { data: templateData, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_default', true)
          .eq('domain_id', profileData?.domain_id || null)
          .maybeSingle();
          
        if (templateError) {
          throw templateError;
        }
        
        // If no domain-specific default template is found, try to get a public default template
        if (!templateData) {
          const { data: publicTemplate, error: publicTemplateError } = await supabase
            .from('templates')
            .select('*')
            .eq('is_default', true)
            .eq('is_public', true)
            .maybeSingle();
            
          if (publicTemplateError) {
            throw publicTemplateError;
          }
          
          setDefaultTemplate(publicTemplate);
        } else {
          setDefaultTemplate(templateData);
        }
        
        // Fetch template notes if we have a default template
        if (templateData || defaultTemplate) {
          const templateId = templateData?.id || defaultTemplate?.id;
          
          if (templateId) {
            try {
              const notes = await loadTemplateNotes(templateId);
              console.log('Template notes loaded:', notes);
              setTemplateNotes(notes || []);
              
              // Initialize template note values with the custom_content values if they exist
              const initialValues: Record<string, string> = {};
              notes.forEach(note => {
                // Pre-populate with custom_content value or empty string
                initialValues[note.id] = note.custom_content || '';
              });
              setTemplateNoteValues(initialValues);
            } catch (notesError) {
              console.error('Error fetching template notes:', notesError);
              toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load template notes. Please try again.',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching default template:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load template information. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDefaultTemplate();
  }, [navigate, toast]);
  
  const handleInputChange = (id: string, value: string) => {
    setTemplateNoteValues(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!reportName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a report name.',
        });
        return;
      }
      
      if (!defaultTemplate) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No default template available. Please contact your administrator.',
        });
        return;
      }
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }
      
      // Create new project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: reportName,
          template_id: defaultTemplate.id,
          user_id: session.user.id
        })
        .select('id')
        .single();
        
      if (projectError) {
        throw projectError;
      }
      
      // Create notes for each template note
      const notesPromises = templateNotes
        .filter(note => note.custom_content && templateNoteValues[note.id])
        .map(note => {
          return supabase
            .from('notes')
            .insert({
              project_id: projectData.id,
              user_id: session.user.id,
              title: note.title,
              name: note.name,
              content: templateNoteValues[note.id]
            });
        });
        
      await Promise.all(notesPromises);
      
      toast({
        title: 'Success',
        description: 'Project created successfully!',
      });
      
      // Navigate to the next step (this would be Step 2 in future implementation)
      // For now, navigate to the projects dashboard
      navigate('/dashboard/projects');
      
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create project. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setReportName('');
    
    // Reset template note values
    const resetValues: Record<string, string> = {};
    templateNotes.forEach(note => {
      resetValues[note.id] = '';
    });
    setTemplateNoteValues(resetValues);
  };

  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6">Start New Report</h1>
      
      {/* Step Banners */}
      <div className="flex justify-center mb-8 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <StepBanner 
            key={step}
            step={step}
            isActive={step === 1}
            onClick={() => {
              // In future implementations, this will navigate to the appropriate step
              toast({
                description: `Step ${step} will be implemented in a future update.`,
              });
            }}
          />
        ))}
      </div>
      
      {/* Instructions Placeholder */}
      <div className="bg-accent/30 p-4 rounded-md mb-6">
        <p className="text-muted-foreground">[Instructions for Step 1 will be added here]</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-quanta-blue"></div>
        </div>
      ) : (
        <>
          {/* Report Name and Template Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="reportName" className="block text-sm font-medium mb-1">
                Report Name
              </label>
              <Input
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Template
              </label>
              <div className="p-2 border rounded-md bg-gray-50">
                {defaultTemplate ? defaultTemplate.name : 'No default template available'}
              </div>
            </div>
          </div>
          
          {/* Template Notes Form */}
          {templateNotes.length > 0 ? (
            <TemplateNotesForm
              templateNotes={templateNotes}
              values={templateNoteValues}
              onChange={handleInputChange}
            />
          ) : (
            <div className="text-center py-4 bg-accent/30 rounded-md">
              <p>No template notes available for this template.</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="mr-2">Saving</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StartNewReport;
