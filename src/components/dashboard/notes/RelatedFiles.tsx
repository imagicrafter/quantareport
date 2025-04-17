
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
      console.log('Opening image annotation for file:', {
        id: file.file_id,
        path: file.file_path,
        name: file.file?.name,
        projectId: file.file?.project_id
      });
      
      if (!file.file_id || !file.file_path || !file.file?.name || !file.file?.project_id) {
        console.error('Missing required file information for annotation:', file);
        return;
      }
      
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
                    onError={(e) => {
                      console.error(`Image failed to load: ${file.file_path}`);
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMi41QTEuNSAxLjUgMCAwMDguNSAxSDIuNUExLjUgMS41IDAgMDAxIDIuNXY4QTEuNSAxLjUgMCAwMDIuNSAxMkg0djEuNUgyLjVBMyAzIDAgMDEtLjUgMTAuNXYtOEEzIDMgMCAwMTIuNS0uNWg2QTMgMyAwIDAxMTEuNSAyLjVWNEgxMFYyLjVaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD48cGF0aCBkPSJNNi41IDRINi41QTIuNSAyLjUgMCAwMDQgNi41VjEzLjVBMi41IDIuNSAwIDAwNi41IDE2SDEzLjVBMi41IDIuNSAwIDAwMTYgMTMuNVY2LjVBMi41IDIuNSAwIDAwMTMuNSA0SDEzLjVINi41Wk02LjUgNS41SDEzLjVBMSAxIDAgMDExNC41IDYuNVYxMEgxMS43OTNMMTAuODk3IDguNjkzQTEuNSAxLjUgMCAwMDkuNjUgOEg1LjVWNi41QTEgMSAwIDAxNi41IDUuNVpNMTMuNSAxNC41SDYuNUExIDEgMCAwMTUuNSAxMy41VjkuNUg5LjY1TDEwLjU0NyAxMC44MDdBMS41IDEuNSAwIDAwMTEuNzkzIDExLjVIMTQuNVYxMy41QTEgMSAwIDAxMTMuNSAxNC41WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PC9zdmc+';
                      (e.target as HTMLImageElement).classList.add('p-2');
                    }}
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
          onClose={() => {
            console.log("Closing image annotation modal");
            setSelectedImage(null);
            onRelationshipsChanged(); // Refresh the list to show any newly created annotations
          }}
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
