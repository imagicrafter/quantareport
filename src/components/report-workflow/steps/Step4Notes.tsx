
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  category: 'observation' | 'finding' | 'recommendation';
}

const Step4Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock notes data - in a real app this would come from a hook or context
  const [notes, setNotes] = useState<Note[]>([
    { 
      id: '1', 
      title: 'General Observations', 
      content: 'The property appears to be in good condition overall with no major structural issues visible.',
      category: 'observation'
    },
    { 
      id: '2', 
      title: 'Roof Condition', 
      content: 'The roof shows signs of aging with some shingles needing replacement in the next 1-2 years.',
      category: 'finding'
    },
    { 
      id: '3', 
      title: 'Foundation Assessment', 
      content: 'No major cracks or settling issues observed in the foundation.',
      category: 'observation'
    },
    { 
      id: '4', 
      title: 'Repair Recommendations', 
      content: 'It is recommended to replace the aging water heater within the next 6 months.',
      category: 'recommendation'
    }
  ]);
  
  const handleNoteChange = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };
  
  const handleSaveNotes = () => {
    // In a real app, we would save the notes to the database here
    toast({
      title: "Notes saved",
      description: "Your notes have been saved successfully."
    });
    navigate('/dashboard/report-wizard/generate');
  };
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/process');
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={4} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="observation">Observations</TabsTrigger>
            <TabsTrigger value="finding">Findings</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6 space-y-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">{note.title}</h3>
                  <Textarea
                    value={note.content}
                    onChange={(e) => handleNoteChange(note.id, e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          {['observation', 'finding', 'recommendation'].map((category) => (
            <TabsContent key={category} value={category} className="mt-6 space-y-4">
              {notes
                .filter((note) => note.category === category)
                .map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">{note.title}</h3>
                      <Textarea
                        value={note.content}
                        onChange={(e) => handleNoteChange(note.id, e.target.value)}
                        className="min-h-[100px]"
                      />
                    </CardContent>
                  </Card>
                ))}
              {notes.filter((note) => note.category === category).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No {category} notes available.
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button onClick={handleSaveNotes}>
          Next: Generate Report
        </Button>
      </div>
    </div>
  );
};

export default Step4Notes;
