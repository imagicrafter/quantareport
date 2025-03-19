
import { useState, useEffect } from 'react';
import { File, X, Music, Folder, FileText } from 'lucide-react';
import { NoteFileRelationship, removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { toast } from 'sonner';

interface RelatedFilesProps {
  noteId: string;
  relationships: NoteFileRelationship[];
  onRelationshipsChanged: () => void;
}

const RelatedFiles = ({ noteId, relationships, onRelationshipsChanged }: RelatedFilesProps) => {
  const handleRemoveFile = async (relationshipId: string) => {
    const success = await removeFileFromNote(relationshipId);
    if (success) {
      onRelationshipsChanged();
    }
  };

  if (relationships.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No files associated with this note
      </div>
    );
  }

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
      <h3 className="text-sm font-medium">Related Files</h3>
      <div className="grid grid-cols-1 gap-2">
        {relationships.map((rel) => (
          <div 
            key={rel.id} 
            className="flex items-center justify-between p-2 bg-secondary/30 rounded-md"
          >
            <div className="flex items-center space-x-2">
              {rel.file?.type === 'image' ? (
                <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                  <img 
                    src={rel.file.file_path} 
                    alt={rel.file.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded">
                  {getFileIcon(rel.file?.type || 'file')}
                </div>
              )}
              <div className="truncate">
                <div className="text-sm font-medium truncate">{rel.file?.name || 'Unknown file'}</div>
                <div className="text-xs text-muted-foreground capitalize">{rel.file?.type || 'file'}</div>
              </div>
            </div>
            <button
              onClick={() => handleRemoveFile(rel.id)}
              className="p-1 text-muted-foreground hover:text-destructive rounded-full hover:bg-secondary"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedFiles;
