
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
  onRelationshipsChanged: () => void;
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
        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {relationships.map((rel) => (
            <div 
              key={rel.id} 
              className="flex items-center justify-between p-2 bg-secondary/30 rounded-md"
            >
              <div className="flex items-center space-x-2">
                {rel.file_type === 'image' ? (
                  <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                    <img 
                      src={rel.file_path} 
                      alt={rel.file?.name || 'Image'} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded">
                    {getFileIcon(rel.file_type || 'file')}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-sm font-medium truncate">{rel.file?.name || 'Unknown file'}</div>
                  <div className="text-xs text-muted-foreground capitalize">{rel.file_type || 'file'}</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleRemoveFile(rel.id);
                }}
                className="p-1 text-muted-foreground hover:text-destructive rounded-full hover:bg-secondary"
                title="Remove file"
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
