
import { useState } from 'react';
import { File, X, Music, Folder, FileText, Plus } from 'lucide-react';
import { removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import ImagePreviewModal from '@/components/report-workflow/file-upload/ImagePreviewModal';

interface RelatedFilesProps {
  files: NoteFileRelationshipWithType[];
  noteId?: string;
  projectId?: string;
  onRelationshipsChanged?: (newRelationship?: NoteFileRelationshipWithType) => void;
  compact?: boolean;
  onManageFilesClick?: () => void; // allow opening the Manage Files modal via dashed square
}

const RelatedFiles = ({ 
  files, 
  onRelationshipsChanged, 
  compact = false,
  onManageFilesClick
}: RelatedFilesProps) => {
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleRemoveFile = async (relationshipId: string) => {
    try {
      setRemovingFileId(relationshipId);
      const success = await removeFileFromNote(relationshipId);
      if (success) {
        onRelationshipsChanged?.();
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

  if (compact) {
    return (
      <div className="flex items-center">
        <FileText size={18} className="mr-2 text-muted-foreground" />
        <span className="text-sm">
          {files.length === 0 ? 'No files attached' : `${files.length} ${files.length === 1 ? 'file' : 'files'} attached`}
        </span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center gap-4">
        {onManageFilesClick && (
          <button
            type="button"
            className="h-32 w-32 flex items-center justify-center border-2 border-dashed border-primary/40 rounded-md bg-background/80 text-primary hover:bg-secondary/30 text-4xl transition focus:outline-none"
            aria-label="Add or Manage Related Files"
            onClick={onManageFilesClick}
          >
            <Plus size={36} />
          </button>
        )}
      </div>
    );
  }

  const imageFiles = files.filter(rel => rel.file_type === 'image');
  const otherFiles = files.filter(rel => rel.file_type !== 'image');

  return (
    <div className="space-y-4">
      {imageFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {imageFiles.map((rel) => (
            <div key={rel.id} className="relative group">
              <div 
                className="h-32 w-32 rounded-md overflow-hidden border border-border cursor-pointer"
                onClick={() => setSelectedImage(rel.file_path)}
              >
                <img
                  src={rel.file_path}
                  alt={rel.file?.name || 'Image preview'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              {onRelationshipsChanged && (
                <button
                  className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveFile(rel.id)}
                  disabled={removingFileId === rel.id}
                >
                  <X size={12} className="text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
          {onManageFilesClick && (
            <button
              type="button"
              className="h-32 w-32 flex items-center justify-center border-2 border-dashed border-primary/40 rounded-md bg-background/80 text-primary hover:bg-secondary/30 text-4xl transition focus:outline-none"
              aria-label="Add or Manage Related Files"
              onClick={onManageFilesClick}
            >
              <Plus size={36} />
            </button>
          )}
        </div>
      )}
      
      {otherFiles.length > 0 && (
        <div className="space-y-2">
          {otherFiles.map((rel) => (
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
              {onRelationshipsChanged && (
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
              )}
            </div>
          ))}
        </div>
      )}
      
      <ImagePreviewModal
        imageUrl={selectedImage || ''}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default RelatedFiles;
