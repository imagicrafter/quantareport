import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { setWorkflowState } from '@/services/workflowService';
import { WorkflowState } from '@/types/workflow.types';

interface Template {
  id: string;
  name: string;
  description: string;
}

const Step1Start = () => {
  const [reportName, setReportName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateNotes, setTemplateNotes] = useState<any[]>([]);
  const [templateNoteValues, setTemplateNoteValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { projectId: paramProjectId } = useParams();
  const [projectId, setProjectId] = useState<string | null>(paramProjectId || location.state?.projectId || null);
  
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*');
        
        if (error) {
          console.error('Error fetching templates:', error);
          toast({
            title: 'Error',
            description: 'Failed to load templates. Please try again.',
            variant: 'destructive',
          });
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load templates. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [toast]);
  
  useEffect(() => {
    const fetchTemplateNotes = async () => {
      if (selectedTemplate) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('template_notes')
            .select('*')
            .eq('template_id', selectedTemplate);
          
          if (error) {
            console.error('Error fetching template notes:', error);
            toast({
              title: 'Error',
              description: 'Failed to load template notes. Please try again.',
              variant: 'destructive',
            });
          } else {
            setTemplateNotes(data || []);
            // Initialize templateNoteValues with empty strings
            const initialValues: Record<string, string> = {};
            data?.forEach((note: any) => {
              initialValues[note.id] = '';
            });
            setTemplateNoteValues(initialValues);
          }
        } catch (error) {
          console.error('Error fetching template notes:', error);
          toast({
            title: 'Error',
            description: 'Failed to load template notes. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchTemplateNotes();
  }, [selectedTemplate, toast]);
  
  useEffect(() => {
    // If we have a projectId from the URL params or location state, we need to update the workflow state
    if (projectId) {
      const updateWorkflowState = async () => {
        try {
          console.log('Step1Start - Updating workflow state for project:', projectId);
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await setWorkflowState(
              projectId,
              user.data.user.id,
              1 as WorkflowState
            );
            console.log('Step1Start - Successfully updated workflow state to 1');
          }
        } catch (error) {
          console.error('Step1Start - Error updating workflow state:', error);
        }
      };
      
      updateWorkflowState();
    }
  }, [projectId]);
  
  const handleTemplateNoteChange = (noteId: string, value: string) => {
    setTemplateNoteValues(prevValues => ({
      ...prevValues,
      [noteId]: value,
    }));
  };
  
  const handleSave = async () => {
    if (!reportName || !selectedTemplate) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a report name and select a template.',
        variant: 'destructive',
      });
      return;
    }
    
    // Determine if we are creating a new report or updating an existing one
    const reportMode = projectId ? 'update' : 'new';
    
    // Pass all necessary data to the saveReport function
    navigate('/dashboard/report-wizard/files', {
      state: {
        reportMode,
        reportName,
        templateId: selectedTemplate,
        selectedProjectId: projectId,
        templateNotes,
        templateNoteValues
      },
      replace: true
    });
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={1} />
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder="Enter report name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="template">Template</Label>
              <Select onValueChange={setSelectedTemplate}>
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
            
            {templateNotes.length > 0 && (
              <div>
                <h3 className="text-xl font-medium mb-2">Template Notes</h3>
                {templateNotes.map((note) => (
                  <div key={note.id} className="mb-4">
                    <Label htmlFor={`note-${note.id}`}>{note.title}</Label>
                    <Textarea
                      id={`note-${note.id}`}
                      placeholder={note.name}
                      value={templateNoteValues[note.id] || ''}
                      onChange={(e) => handleTemplateNoteChange(note.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <Button onClick={handleSave} disabled={loading}>
              Next: Upload Files
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Step1Start;
