import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/signin');
          return;
        }
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('domain_id')
          .eq('id', session.user.id)
          .single();
          
        const returningFromStep2 = location.state?.returnToStep2;
        const projectIdFromStep2 = location.state?.projectId;
        
        if (returningFromStep2 && projectIdFromStep2) {
          setReportMode('update');
          setSelectedProjectId(projectIdFromStep2);
          await handleProjectSelect(projectIdFromStep2);
        }
        
        const { data: templateData, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_default', true)
          .eq('domain_id', profileData?.domain_id || null)
          .maybeSingle();
          
        if (templateError) {
          throw templateError;
        }
        
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
        
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (projectsError) {
          throw projectsError;
        }
        
        setExistingProjects(projects || []);
        
        if (templateData || defaultTemplate) {
          const templateId = templateData?.id || defaultTemplate?.id;
          
          if (templateId) {
            try {
              const notes = await loadTemplateNotes(templateId);
              console.log('Template notes loaded:', notes);
              setTemplateNotes(notes || []);
              
              const initialValues: Record<string, string> = {};
              notes.forEach(note => {
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
  }, [navigate, toast, location]);
  
  useEffect(() => {
    if (reportMode === 'new') {
      setReportName('');
      setSelectedProjectId('');
      
      const resetValues: Record<string, string> = {};
      templateNotes.forEach(note => {
        resetValues[note.id] = note.custom_content || '';
      });
      setTemplateNoteValues(resetValues);
      
      if (defaultTemplate?.id) {
        loadTemplateNotes(defaultTemplate.id)
          .then(notes => {
            setTemplateNotes(notes || []);
            
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
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*, templates(*)')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      setReportName(project.name);
      
      if (project.template_id) {
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', project.template_id)
          .single();
          
        if (templateError) throw templateError;
        setDefaultTemplate(template);
        
        const templateNotes = await loadTemplateNotes(template.id);
        setTemplateNotes(templateNotes || []);
        
        const { data: notes, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('project_id', projectId);
          
        if (notesError) throw notesError;
        
        const noteValues: Record<string, string> = {};
        
        templateNotes.forEach(templateNote => {
          const matchingNote = notes.find(note => note.name === templateNote.name);
          if (matchingNote) {
            noteValues[templateNote.id] = matchingNote.content || '';
          } else {
            noteValues[templateNote.id] = '';
          }
        });
        
        setTemplateNoteValues(noteValues);
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
  };
  
  const handleSave = async (navigateToStep2: boolean = false) => {
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
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }

      let currentProjectId = "";
      
      if (reportMode === 'new') {
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
        
        currentProjectId = projectData.id;
        
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
        if (!selectedProjectId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a project to update.',
          });
          return;
        }
        
        currentProjectId = selectedProjectId;
        
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: reportName })
          .eq('id', selectedProjectId);
          
        if (projectError) {
          throw projectError;
        }
        
        const { data: existingNotes, error: notesError } = await supabase
          .from('notes')
          .select('id, name')
          .eq('project_id', selectedProjectId);
          
        if (notesError) throw notesError;
        
        const existingNotesByName: Record<string, string> = {};
        existingNotes?.forEach(note => {
          if (note.name) {
            existingNotesByName[note.name] = note.id;
          }
        });
        
        const notePromises = templateNotes
          .filter(note => note.name && templateNoteValues[note.id])
          .map(note => {
            const existingNoteId = existingNotesByName[note.name];
            
            if (existingNoteId) {
              return supabase
                .from('notes')
                .update({ content: templateNoteValues[note.id] })
                .eq('id', existingNoteId);
            } else {
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
      
      if (navigateToStep2) {
        navigate(`/dashboard/upload-and-prepare-files?projectId=${currentProjectId}`);
      } else if (!navigateToStep2) {
        navigate('/dashboard/projects');
      }
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
    
    const resetValues: Record<string, string> = {};
    templateNotes.forEach(note => {
      resetValues[note.id] = '';
    });
    setTemplateNoteValues(resetValues);
  };

  const handleStepClick = (step: number) => {
    if (step === 1) {
    } else if (step === 2) {
      if (reportMode === 'new' && !reportName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a report name before proceeding to Step 2.',
        });
        return;
      }
      
      if (reportMode === 'update' && !selectedProjectId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a project before proceeding to Step 2.',
        });
        return;
      }
      
      handleSave(true);
    } else {
      toast({
        description: `Step ${step} will be implemented in a future update.`,
      });
    }
  };

  const handleSaveClick = () => {
    handleSave(false);
  };

  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {reportMode === 'new' ? 'Start New Report' : 'Update Report'}
      </h1>
      
      <div className="mb-8">
        <StepIndicator 
          currentStep={1}
          totalSteps={6}
          onStepClick={handleStepClick}
        />
      </div>
      
      <div className="bg-accent/30 p-4 rounded-md mb-6">
        <p className="text-muted-foreground text-center">[Instructions for Step 1 will be added here]</p>
      </div>
      
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
          
          <div className="flex justify-end gap-4 mt-8 max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
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
