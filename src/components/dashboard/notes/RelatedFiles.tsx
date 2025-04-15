
import React from 'react';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { Button } from '@/components/ui/button';
import { File, FileImage, FileText, FileMinus, Headphones } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RelatedFilesProps {
  files: NoteFileRelationshipWithType[];
  noteId?: string;
  projectId?: string;
  onRelationshipsChanged?: () => void;
  compact?: boolean;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <FileImage className="h-4 w-4 text-blue-500" />;
    case 'audio':
      return <Headphones className="h-4 w-4 text-green-500" />;
    case 'text':
    case 'transcription':
      return <FileText className="h-4 w-4 text-orange-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
};

const RelatedFiles = ({ files, noteId, projectId, onRelationshipsChanged, compact = false }: RelatedFilesProps) => {
  const { toast } = useToast();

  if (!files || files.length === 0) {
    return compact ? null : (
      <div className="text-sm text-muted-foreground py-2">
        No files attached to this note.
      </div>
    );
  }

  const handleRemoveFile = async (relationshipId: string) => {
    try {
      await removeFileFromNote(relationshipId);
      if (onRelationshipsChanged) {
        onRelationshipsChanged();
      }
    } catch (error) {
      console.error('Error removing file relationship:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove file from note',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={compact ? "" : "mt-4"}>
      <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-3'}`}>
        {files.map((rel) => (
          <div 
            key={rel.id} 
            className={`${compact ? 'p-2' : 'p-3'} bg-muted/50 rounded-md flex items-center justify-between group`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {getFileIcon(rel.file_type)}
              <div className="truncate">
                <div className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
                  {rel.file?.name || 'Unnamed file'}
                </div>
                {!compact && (
                  <div className="text-xs text-muted-foreground capitalize">
                    {rel.file_type || 'file'}
                  </div>
                )}
              </div>
            </div>
            {noteId && onRelationshipsChanged && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(rel.id)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${compact ? 'h-7 w-7 p-0' : ''}`}
              >
                <FileMinus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedFiles;
