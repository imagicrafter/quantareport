
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import NotesList from '@/components/dashboard/notes/NotesList';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { Note } from '@/utils/noteUtils';
import { DndContext } from '@dnd-kit/core';

const Step4Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const [activeTab, setActiveTab] = useState('all');
  
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
        setNotes(data || []);
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
  
  // Edit note handler (redirects to notes page in a new tab)
  const handleEditNote = (note: Note) => {
    // Open the notes page in a new tab, focused on this project
    window.open(`/dashboard/notes/${projectId}`, '_blank');
  };
  
  // Delete note handler (disabled in this view)
  const handleDeleteNote = (note: Note) => {
    toast({
      title: "Note Deletion Disabled",
      description: "Please use the Notes section to manage notes",
    });
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
  
  // Filter notes based on the active tab
  const filteredNotes = () => {
    if (activeTab === 'all') return notes;
    
    return notes.filter(note => {
      if (!note.metadata) return false;
      try {
        const metadata = typeof note.metadata === 'string' 
          ? JSON.parse(note.metadata) 
          : note.metadata;
        return metadata.category === activeTab;
      } catch (e) {
        return false;
      }
    });
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={4} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="observation">Observations</TabsTrigger>
            <TabsTrigger value="finding">Findings</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            <NotesList 
              notes={filteredNotes()}
              loading={loading}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onDragEnd={handleOnDragEnd}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button onClick={handleNext}>
          Next: Generate Report
        </Button>
      </div>
    </div>
  );
};

export default Step4Notes;
