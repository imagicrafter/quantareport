import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import NotesList from '@/components/dashboard/notes/NotesList';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { Note, parseNoteMetadata } from '@/utils/noteUtils';
import { DragDropContext } from 'react-beautiful-dnd';
import EditNoteDialog from '@/components/dashboard/notes/EditNoteDialog';
import DeleteNoteDialog from '@/components/dashboard/notes/DeleteNoteDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, NoteFormValues } from '@/components/dashboard/notes/hooks/useNotesOperations';

const Step4Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const [activeTab, setActiveTab] = useState('all');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  
  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });
  
  useEffect(() => {
    const getProjectId = async () => {
      const { projectId: currentProjectId } = await fetchCurrentWorkflow();
      if (currentProjectId) {
        setProjectId(currentProjectId);
        fetchNotes(currentProjectId);
      } else {
        toast({
          title: "Project not found",
          description: "Unable to load project notes",
          variant: "destructive"
        });
        navigate('/dashboard/report-wizard/start');
      }
    };
    
    getProjectId();
  }, []);
  
  const fetchNotes = async (projectId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .not('metadata', 'is', null)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive"
        });
      } else {
        const processedNotes = data.map(note => parseNoteMetadata(note));
        setNotes(processedNotes);
      }
    } catch (error) {
      console.error('Error in fetchNotes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOnDragEnd = async (result: any) => {
    if (!result.destination || !projectId) return;

    try {
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      
      if (sourceIndex === destinationIndex) return;
      
      const reorderedNotes = [...notes];
      const [removed] = reorderedNotes.splice(sourceIndex, 1);
      reorderedNotes.splice(destinationIndex, 0, removed);
      
      const updatedNotes = reorderedNotes.map((note, index) => ({
        ...note,
        position: index + 1
      }));
      
      setNotes(updatedNotes);
      
      const updates = updatedNotes.map(note => ({
        id: note.id,
        position: note.position,
        name: note.name,
        title: note.title,
        project_id: note.project_id,
        user_id: note.user_id
      }));
      
      const { error } = await supabase
        .from('notes')
        .upsert(updates);
      
      if (error) {
        console.error('Error updating note positions:', error);
        toast({
          title: "Error",
          description: "Failed to update note order",
          variant: "destructive"
        });
        fetchNotes(projectId);
      }
    } catch (error) {
      console.error('Error in handleOnDragEnd:', error);
    }
  };
  
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    editForm.reset({
      title: note.title,
      content: note.content || '',
      analysis: note.analysis || '',
    });
    
    fetchNoteRelatedFiles(note.id);
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteDialogOpen(true);
  };
  
  const fetchNoteRelatedFiles = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('note_file_relationships')
        .select(`
          id, 
          note_id, 
          file_id, 
          files:file_id (
            id, 
            name, 
            type, 
            file_path
          )
        `)
        .eq('note_id', noteId);
      
      if (error) throw error;
      
      const formattedFiles = data.map(rel => ({
        id: rel.id,
        note_id: rel.note_id,
        file_id: rel.file_id,
        file_type: rel.files?.type || '',
        file_path: rel.files?.file_path || '',
        file_name: rel.files?.name || '',
      }));
      
      setRelatedFiles(formattedFiles);
    } catch (error) {
      console.error('Error fetching related files:', error);
    }
  };
  
  const handleEditNoteSubmit = async () => {
    if (!selectedNote) return;
    
    try {
      setSaving(true);
      const values = editForm.getValues();
      
      const { error } = await supabase
        .from('notes')
        .update({
          title: values.title,
          content: values.content || '',
          analysis: values.analysis || null,
        })
        .eq('id', selectedNote.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Note updated successfully!",
      });
      
      setIsEditDialogOpen(false);
      fetchNotes(projectId!);
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteNoteSubmit = async () => {
    if (!selectedNote) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', selectedNote.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });
      
      setIsDeleteDialogOpen(false);
      fetchNotes(projectId!);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = async () => {
    if (projectId) {
      await updateWorkflowState(projectId, 3);
    }
    navigate('/dashboard/report-wizard/process');
  };
  
  const handleNext = async () => {
    if (projectId) {
      await updateWorkflowState(projectId, 5);
    }
    navigate('/dashboard/report-wizard/generate');
  };
  
  const handleAnalyzeImages = async () => {
    setAnalyzingImages(true);
    setTimeout(() => {
      setAnalyzingImages(false);
      toast({
        title: "Image Analysis",
        description: "Analysis feature available in the Notes section"
      });
    }, 1000);
  };
  
  const handleTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };
  
  const filteredNotes = () => {
    if (activeTab === 'all') return notes;
    
    return notes.filter(note => {
      if (!note.metadata) return false;
      try {
        const metadata = note.metadata;
        return metadata.category === activeTab;
      } catch (e) {
        return false;
      }
    });
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-none">
        <InstructionsPanel stepNumber={4} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col overflow-hidden px-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 mb-6 flex-none">
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="observation">Observations</TabsTrigger>
              <TabsTrigger value="finding">Findings</TabsTrigger>
              <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                {activeTab && (
                  <TabsContent value={activeTab} className="mt-0 h-full">
                    <NotesList 
                      notes={filteredNotes()}
                      loading={loading}
                      onEditNote={handleEditNote}
                      onDeleteNote={handleDeleteNote}
                      onDragEnd={handleOnDragEnd}
                    />
                  </TabsContent>
                )}
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>
      
      <div className="flex-none border-t bg-background w-full py-4">
        <div className="max-w-3xl mx-auto w-full px-4 flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          
          <Button onClick={handleNext}>
            Next: Generate Report
          </Button>
        </div>
      </div>
      
      <EditNoteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        form={editForm}
        onSubmit={handleEditNoteSubmit}
        saving={saving}
        selectedNote={selectedNote}
        analyzingImages={analyzingImages}
        relatedFiles={relatedFiles}
        onAnalyzeImages={handleAnalyzeImages}
        onFileAdded={() => fetchNoteRelatedFiles(selectedNote?.id || '')}
        projectId={projectId || ''}
        onTranscriptionComplete={handleTranscriptionComplete}
      />
      
      <DeleteNoteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteNoteSubmit}
        saving={saving}
      />
    </div>
  );
};

export default Step4Notes;
