
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

// We can now use the Note interface directly since we've updated it to handle metadata properly
const Step4Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const [activeTab, setActiveTab] = useState('all');
  
  // State variables for edit and delete functionality
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  
  // Edit form for the dialog
  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      analysis: '',
    },
  });
  
  // Fetch the current project ID from workflow
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
  
  // Fetch notes for the project with metadata filter
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
        // Process notes data - parse metadata if needed
        const processedNotes = data.map(note => parseNoteMetadata(note));
        setNotes(processedNotes);
      }
    } catch (error) {
      console.error('Error in fetchNotes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle note reordering (same as in NotesSection)
  const handleOnDragEnd = async (result: any) => {
    if (!result.destination || !projectId) return;

    try {
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      
      if (sourceIndex === destinationIndex) return;
      
      // Create a copy of the notes array
      const reorderedNotes = [...notes];
      const [removed] = reorderedNotes.splice(sourceIndex, 1);
      reorderedNotes.splice(destinationIndex, 0, removed);
      
      // Update position values
      const updatedNotes = reorderedNotes.map((note, index) => ({
        ...note,
        position: index + 1
      }));
      
      setNotes(updatedNotes);
      
      // Update positions in database
      const updates = updatedNotes.map(note => ({
        id: note.id,
        position: note.position,
        // Include these required fields from the existing note
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
        // Refresh notes to restore original order
        fetchNotes(projectId);
      }
    } catch (error) {
      console.error('Error in handleOnDragEnd:', error);
    }
  };
  
  // Edit note handler - now opens the edit dialog
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    editForm.reset({
      title: note.title,
      content: note.content || '',
      analysis: note.analysis || '',
    });
    
    // Fetch related files if needed
    fetchNoteRelatedFiles(note.id);
    
    setIsEditDialogOpen(true);
  };
  
  // Delete note handler - now opens the delete dialog
  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteDialogOpen(true);
  };
  
  // Fetch related files for a note
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
      
      // Format related files for the component
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
  
  // Handle edit note submission
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
  
  // Handle delete note submission
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
  
  // Navigation handlers with workflow state updates
  const handleBack = async () => {
    if (projectId) {
      // Update workflow state to 3 (Process Files)
      await updateWorkflowState(projectId, 3);
    }
    navigate('/dashboard/report-wizard/process');
  };
  
  const handleNext = async () => {
    if (projectId) {
      // Update workflow state to 5 (Generate Report)
      await updateWorkflowState(projectId, 5);
    }
    navigate('/dashboard/report-wizard/generate');
  };
  
  // Analyze images handler for edit dialog
  const handleAnalyzeImages = async () => {
    setAnalyzingImages(true);
    // This would normally trigger the image analysis
    // For now, simulate analysis with a timeout
    setTimeout(() => {
      setAnalyzingImages(false);
      toast({
        title: "Image Analysis",
        description: "Analysis feature available in the Notes section"
      });
    }, 1000);
  };
  
  // Handle transcription complete
  const handleTranscriptionComplete = (text: string) => {
    editForm.setValue('content', text);
  };
  
  // Filter notes based on the active tab
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
    <div className="flex flex-col h-full">
      <InstructionsPanel stepNumber={4} />
      
      <div className="max-w-3xl mx-auto w-full flex flex-col mb-8" style={{ height: 'calc(100vh - 300px)' }}>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="observation">Observations</TabsTrigger>
            <TabsTrigger value="finding">Findings</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
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
      
      <div className="flex justify-between max-w-3xl mx-auto w-full sticky bottom-0 bg-background pt-4 pb-8">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button onClick={handleNext}>
          Next: Generate Report
        </Button>
      </div>
      
      {/* Edit Note Dialog */}
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
      
      {/* Delete Note Dialog */}
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
