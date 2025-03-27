
import { useState } from 'react';
import { File, X, Music, Folder, FileText } from 'lucide-react';
import { NoteFileRelationship, removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { toast } from 'sonner';
import FilePicker from './FilePicker';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';

interface RelatedFilesProps {
  noteId: string;
  projectId: string;
  relationships: NoteFileRelationshipWithType[];
  onRelationshipsChanged: (newRelationship?: NoteFileRelationshipWithType) => void;
}

const RelatedFiles = ({ noteId, projectId, relationships, onRelationshipsChanged }: RelatedFilesProps) => {
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);

  const handleRemoveFile = async (relationshipId: string) => {
    try {
      setRemovingFileId(relationshipId);
      
      // Check if this is a temporary relationship (for new notes)
      const isTemporaryRelationship = relationshipId.startsWith('temp-');
      
      if (isTemporaryRelationship) {
        // For temporary relationships, just notify the parent to update the list
        onRelationshipsChanged();
      } else {
        // For permanent relationships, remove from database
        const success = await removeFileFromNote(relationshipId);
        if (success) {
          onRelationshipsChanged();
        }
      }
    } finally {
      setRemovingFileId(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <File size={18} className="text-blue-500" />;
      case 'audio':
        return <Music size={18} className="text-purple-500" />;
      case 'folder':
        return <Folder size={18} className="text-yellow-600" />;
      default:
        return <FileText size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Related Files</h3>
        <FilePicker 
          projectId={projectId} 
          noteId={noteId}
          onFileAdded={onRelationshipsChanged}
          relatedFiles={relationships}
        />
      </div>
      
      {relationships.length === 0 ? (
        <div className="text-muted-foreground text-sm italic">
          No files associated with this note
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => (
            <div 
              key={rel.id} 
              className="bg-secondary/30 rounded-md p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex items-center justify-center bg-secondary rounded-full">
                  {getFileIcon(rel.file_type || 'file')}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {rel.file?.name || 'Unknown file'}
                  </span>
                  <div className="text-xs text-muted-foreground capitalize">
                    {rel.file_type || 'file'}
                  </div>
                </div>
              </div>
              <button
                className="text-muted-foreground hover:text-destructive p-1 rounded-full"
                onClick={() => handleRemoveFile(rel.id)}
                disabled={removingFileId === rel.id}
              >
                {removingFileId === rel.id ? (
                  <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-muted-foreground animate-spin" />
                ) : (
                  <X size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedFiles;
