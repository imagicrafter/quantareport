
import React, { useState } from 'react';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';
import { removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { ImageAnnotationModal } from '@/components/annotation/ImageAnnotationModal';

interface RelatedFilesProps {
  files: NoteFileRelationshipWithType[];
  onRelationshipsChanged: () => void;
  compact?: boolean;
}

const RelatedFiles: React.FC<RelatedFilesProps> = ({ files, onRelationshipsChanged, compact = false }) => {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    id: string;
    name: string;
    projectId: string;
  } | null>(null);
  
  const handleRemove = async (relationshipId: string) => {
    try {
      await removeFileFromNote(relationshipId);
      onRelationshipsChanged();
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleImageClick = (file: NoteFileRelationshipWithType) => {
    if (file.file_type === 'image') {
      setSelectedImage({
        url: file.file_path,
        id: file.file_id,
        name: file.file?.name || 'image.png',
        projectId: file.file?.project_id || ''
      });
    }
  };

  return (
    <div className="space-y-2">
      {files.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
          No files attached to this note.
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-2`}>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center p-2 border rounded-md bg-secondary/10 gap-2"
            >
              {file.file_type === 'image' ? (
                <div 
                  className="w-10 h-10 bg-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleImageClick(file)}
                >
                  <img
                    src={file.file_path}
                    alt={file.file?.name || 'File preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded">
                  <span className="text-xs font-mono uppercase">{file.file_type?.substring(0, 3) || 'doc'}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.file?.name || 'Unknown file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.file_type}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => handleRemove(file.id)}
              >
                <Trash size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {selectedImage && (
        <ImageAnnotationModal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          fileId={selectedImage.id}
          fileName={selectedImage.name}
          projectId={selectedImage.projectId}
        />
      )}
    </div>
  );
};

export default RelatedFiles;
