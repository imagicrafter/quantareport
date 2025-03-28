
import { useState, useEffect } from 'react';
import { fetchRelatedFiles, removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { Button } from '@/components/ui/button';
import { Trash2, Paperclip, Plus } from 'lucide-react';
import FilePicker from './FilePicker';

export interface RelatedFilesProps {
  noteId: string;
  projectId?: string;
  relationships?: NoteFileRelationshipWithType[];
  onRelationshipsChanged?: () => void;
}

const RelatedFiles = ({ noteId, projectId, relationships: initialRelationships, onRelationshipsChanged }: RelatedFilesProps) => {
  const [relationships, setRelationships] = useState<NoteFileRelationshipWithType[]>(initialRelationships || []);
  const [loading, setLoading] = useState(!initialRelationships);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  useEffect(() => {
    if (!initialRelationships) {
      loadRelatedFiles();
    }
  }, [noteId, initialRelationships]);

  const loadRelatedFiles = async () => {
    setLoading(true);
    try {
      const data = await fetchRelatedFiles(noteId);
      setRelationships(data);
    } catch (error) {
      console.error('Error loading related files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (relationshipId: string) => {
    try {
      const success = await removeFileFromNote(relationshipId);
      if (success) {
        setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
        if (onRelationshipsChanged) {
          onRelationshipsChanged();
        } else {
          // If no callback provided, reload files
          loadRelatedFiles();
        }
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleFileAdded = () => {
    setIsPickerOpen(false);
    if (onRelationshipsChanged) {
      onRelationshipsChanged();
    } else {
      // If no callback provided, reload files
      loadRelatedFiles();
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground mt-2">Loading related files...</div>;
  }

  return (
    <div className="mt-4">
      {relationships && relationships.length > 0 ? (
        <div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Paperclip className="h-3 w-3" />
            <span>Related Files</span>
          </div>
          <div className="space-y-1">
            {relationships.map((rel) => (
              <div key={rel.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-sm text-xs">
                <span className="truncate max-w-[80%]">{rel.file_path ? rel.file_path.split('/').pop() : 'Unknown file'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemove(rel.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setIsPickerOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Attach File
        </Button>
      </div>
      
      {projectId && (
        <FilePicker
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          projectId={projectId}
          noteId={noteId}
          onFileAdded={handleFileAdded}
        />
      )}
    </div>
  );
};

export default RelatedFiles;
