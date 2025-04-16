import { useState, useEffect } from 'react';
import { Plus, Lock, Unlock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchAvailableFiles, addFileToNote, removeFileFromNote } from '@/utils/noteFileRelationshipUtils';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { Switch } from '@/components/ui/switch';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';

interface FilePickerProps {
  projectId: string;
  noteId: string;
  onFileAdded: () => void;
  relatedFiles: NoteFileRelationshipWithType[];
  isLocked?: boolean;
  onLockToggle?: (locked: boolean) => Promise<void>;
  buttonLabel?: string;
}

const FilePicker = ({ 
  projectId, 
  noteId, 
  onFileAdded, 
  relatedFiles, 
  isLocked = false, 
  onLockToggle,
  buttonLabel = "Add Files"
}: FilePickerProps) => {
  const [open, setOpen] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFileId, setAddingFileId] = useState<string | null>(null);
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [locked, setLocked] = useState(isLocked);
  
  useEffect(() => {
    setLocked(isLocked);
  }, [isLocked]);
  
  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, relatedFiles]);
  
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const files = await fetchAvailableFiles(projectId, noteId);
      setAvailableFiles(files);
    } catch (error) {
      console.error('Error fetching available files:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddFile = async (fileId: string) => {
    try {
      setAddingFileId(fileId);
      await addFileToNote(noteId, fileId);
      onFileAdded();
      fetchFiles();
    } finally {
      setAddingFileId(null);
    }
  };
  
  const handleRemoveFile = async (relationshipId: string) => {
    try {
      setRemovingFileId(relationshipId);
      await removeFileFromNote(relationshipId);
      onFileAdded();
    } finally {
      setRemovingFileId(null);
    }
  };
  
  const handleLockToggle = async () => {
    try {
      if (onLockToggle) {
        await onLockToggle(!locked);
        setLocked(!locked);
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-7 px-2"
        >
          <Plus size={14} />
          <span className="text-xs">{buttonLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 flex justify-between items-center">
          <DialogTitle>Manage Related Files</DialogTitle>
          {onLockToggle && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {locked ? (
                  <Lock size={14} className="inline mr-1" />
                ) : (
                  <Unlock size={14} className="inline mr-1" />
                )}
                {locked ? 'Locked' : 'Unlocked'}
              </span>
              <Switch 
                checked={locked}
                onCheckedChange={handleLockToggle}
              />
            </div>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(80vh-130px)]">
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-medium mb-2">Current Files ({relatedFiles.length})</h3>
            {relatedFiles.length > 0 ? (
              <div className="space-y-2">
                {relatedFiles.map((rel) => (
                  <div 
                    key={rel.id} 
                    className="bg-secondary/30 rounded-md p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {rel.file_type === 'image' && (
                        <div className="h-12 w-12 rounded-md overflow-hidden border border-border">
                          <img
                            src={rel.file_path}
                            alt={rel.file?.name || 'Image preview'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium">
                          {rel.file?.name || 'Unknown file'}
                        </span>
                        <div className="text-xs text-muted-foreground capitalize">
                          {rel.file_type || 'file'}
                        </div>
                      </div>
                    </div>
                    {!locked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(rel.id)}
                        disabled={removingFileId === rel.id}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                      >
                        {removingFileId === rel.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        ) : (
                          <X size={16} />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm italic">
                No files associated with this note
              </div>
            )}
            
            <div className="pt-4 border-t mt-6">
              <h3 className="text-sm font-medium mb-2">Available Files</h3>
              {loading ? (
                <div className="py-4 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                </div>
              ) : availableFiles.length > 0 ? (
                <div className="space-y-2">
                  {availableFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="bg-muted/50 rounded-md p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {file.type === 'image' && file.file_path && (
                          <div className="h-12 w-12 rounded-md overflow-hidden border border-border">
                            <img
                              src={file.file_path}
                              alt={file.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium">{file.name}</span>
                          <div className="text-xs text-muted-foreground capitalize">
                            {/* Do not display file type {file.type || 'file'} */}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddFile(file.id)}
                        disabled={locked || addingFileId === file.id}
                        className="h-8 px-2"
                      >
                        {addingFileId === file.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        ) : (
                          <Plus size={16} />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm italic">
                  No additional files available
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePicker;
