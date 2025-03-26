
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
      const success = await removeFileFromNote(relationshipId);
      if (success) {
        onRelationshipsChanged();
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
        <div className="bg-secondary/30 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center bg-secondary rounded-full">
              <File size={16} />
            </div>
            <span className="text-sm font-medium">
              {relationships.length} {relationships.length === 1 ? 'file' : 'files'} attached
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatedFiles;
