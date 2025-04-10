import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import StepIndicator from '@/components/report-workflow/StepIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import TemplateNotesForm from '@/components/report-workflow/TemplateNotesForm';
import { loadTemplateNotes } from '@/utils/templateNoteUtils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StartNewReport = () => {
  const [reportMode, setReportMode] = useState<'new' | 'update'>('new');
  const [reportName, setReportName] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templateNotes, setTemplateNotes] = useState<any[]>([]);
  const [templateNoteValues, setTemplateNoteValues] = useState<Record<string, string>>({});
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
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
        
        // Load existing projects for the Update Report mode
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (projectsError) {
          throw projectsError;
        }
        
        setExistingProjects(projects || []);
        
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
  
  useEffect(() => {
    if (reportMode === 'new') {
      // Reset form to initial state
      setReportName('');
      setSelectedProjectId('');
      
      // Reset template notes values
      const resetValues: Record<string, string> = {};
      templateNotes.forEach(note => {
        resetValues[note.id] = note.custom_content || '';
      });
      setTemplateNoteValues(resetValues);
      
      // If we have a default template, reload its notes
      if (defaultTemplate?.id) {
        loadTemplateNotes(defaultTemplate.id)
          .then(notes => {
            setTemplateNotes(notes || []);
            
            // Initialize template note values with the custom_content values
            const initialValues: Record<string, string> = {};
            notes.forEach(note => {
              initialValues[note.id] = note.custom_content || '';
            });
            setTemplateNoteValues(initialValues);
          })
          .catch(error => {
            console.error('Error loading default template notes:', error);
          });
      }
    }
  }, [reportMode, defaultTemplate]);
  
  const handleInputChange = (id: string, value: string) => {
    setTemplateNoteValues(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsLoading(true);
    
    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*, templates(*)')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Set report name from project
      setReportName(project.name);
      
      // Set template from project
      if (project.template_id) {
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', project.template_id)
          .single();
          
        if (templateError) throw templateError;
        setDefaultTemplate(template);
        
        // Load template notes structure first
        const templateNotes = await loadTemplateNotes(template.id);
        setTemplateNotes(templateNotes || []);
        
        // Load existing notes content for this project
        const { data: notes, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('project_id', projectId);
          
        if (notesError) throw notesError;
        
        // Map notes to template notes based on name match
        if (notes && templateNotes) {
          const noteValues: Record<string, string> = {};
          
          templateNotes.forEach(templateNote => {
            // Find the corresponding project note
            const matchingNote = notes.find(note => note.name === templateNote.name);
            if (matchingNote) {
              noteValues[templateNote.id] = matchingNote.content || '';
            } else {
              noteValues[templateNote.id] = '';
            }
          });
          
          setTemplateNoteValues(noteValues);
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load project information. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReportModeChange = (mode: 'new' | 'update') => {
    setReportMode(mode);
    // The form reset is now handled in the useEffect
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
          description: 'No template available. Please contact your administrator.',
        });
        return;
      }
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }
      
      if (reportMode === 'new') {
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
          .filter(note => note.name && templateNoteValues[note.id])
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
      } else {
        // Update existing project
        if (!selectedProjectId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a project to update.',
          });
          return;
        }
        
        // Update project name if needed
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: reportName })
          .eq('id', selectedProjectId);
          
        if (projectError) {
          throw projectError;
        }
        
        // Update or insert notes
        const { data: existingNotes, error: notesError } = await supabase
          .from('notes')
          .select('id, name')
          .eq('project_id', selectedProjectId);
          
        if (notesError) throw notesError;
        
        // Create a map of existing notes by name
        const existingNotesByName: Record<string, string> = {};
        existingNotes?.forEach(note => {
          if (note.name) {
            existingNotesByName[note.name] = note.id;
          }
        });
        
        // Update or insert notes based on template notes
        const notePromises = templateNotes
          .filter(note => note.name && templateNoteValues[note.id])
          .map(note => {
            const existingNoteId = existingNotesByName[note.name];
            
            if (existingNoteId) {
              // Update existing note
              return supabase
                .from('notes')
                .update({ content: templateNoteValues[note.id] })
                .eq('id', existingNoteId);
            } else {
              // Insert new note
              return supabase
                .from('notes')
                .insert({
                  project_id: selectedProjectId,
                  user_id: session.user.id,
                  title: note.title,
                  name: note.name,
                  content: templateNoteValues[note.id]
                });
            }
          });
          
        await Promise.all(notePromises);
        
        toast({
          title: 'Success',
          description: 'Project updated successfully!',
        });
      }
      
      // Navigate to the next step (this would be Step 2 in future implementation)
      // For now, navigate to the projects dashboard
      navigate('/dashboard/projects');
      
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save project. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setReportName('');
    setSelectedProjectId('');
    
    // Reset template note values
    const resetValues: Record<string, string> = {};
    templateNotes.forEach(note => {
      resetValues[note.id] = '';
    });
    setTemplateNoteValues(resetValues);
  };

  const handleStepClick = (step: number) => {
    // In future implementations, this will navigate to the appropriate step
    toast({
      description: `Step ${step} will be implemented in a future update.`,
    });
  };

  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {reportMode === 'new' ? 'Start New Report' : 'Update Report'}
      </h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator 
          currentStep={1}
          totalSteps={6}
          onStepClick={handleStepClick}
        />
      </div>
      
      {/* Instructions Placeholder */}
      <div className="bg-accent/30 p-4 rounded-md mb-6">
        <p className="text-muted-foreground text-center">[Instructions for Step 1 will be added here]</p>
      </div>
      
      {/* Report Mode Selection */}
      <div className="w-full max-w-3xl mx-auto mb-6">
        <RadioGroup
          value={reportMode}
          onValueChange={(value) => handleReportModeChange(value as 'new' | 'update')}
          className="flex items-center space-x-6"
          defaultValue="new"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="option-new" />
            <Label htmlFor="option-new">New Report</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="update" id="option-update" />
            <Label htmlFor="option-update">Existing Report</Label>
          </div>
        </RadioGroup>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-quanta-blue"></div>
        </div>
      ) : (
        <>
          {/* Report Name and Template Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
            <div>
              <label htmlFor="reportName" className="block text-sm font-medium mb-1 text-left">
                Report Name
              </label>
              {reportMode === 'new' ? (
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                  className="w-full"
                />
              ) : (
                <Select onValueChange={handleProjectSelect} value={selectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an existing project" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-left">
                Template
              </label>
              <div className="p-2 border rounded-md bg-gray-50">
                {defaultTemplate ? defaultTemplate.name : 'No default template available'}
              </div>
            </div>
          </div>
          
          {/* Template Notes Form - shown for both modes when data is available */}
          {(reportMode === 'new' || (reportMode === 'update' && selectedProjectId)) && (
            <>
              {templateNotes.length > 0 ? (
                <TemplateNotesForm
                  templateNotes={templateNotes}
                  values={templateNoteValues}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="text-center py-4 bg-accent/30 rounded-md max-w-3xl mx-auto">
                  <p>No template notes available.</p>
                </div>
              )}
            </>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (reportMode === 'update' && !selectedProjectId)}
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
