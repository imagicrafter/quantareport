import { useState, useEffect } from 'react';
import { File, Music, Folder, FileText, Plus, X } from 'lucide-react';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { 
  fetchAvailableFiles, 
  addFileToNote, 
  removeFileFromNote,
  NoteFileRelationship,
  fetchRelatedFiles
} from '@/utils/noteFileRelationshipUtils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui-elements/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteFileRelationshipWithType } from '@/utils/noteUtils';

interface FilePickerProps {
  projectId: string;
  noteId: string;
  onFileAdded: () => void;
  relatedFiles: NoteFileRelationshipWithType[];
}

const FilePicker = ({ projectId, noteId, onFileAdded, relatedFiles }: FilePickerProps) => {
  const [open, setOpen] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [addingFileId, setAddingFileId] = useState<string | null>(null);
  
  const loadFiles = async () => {
    setLoading(true);
    try {
      const files = await fetchAvailableFiles(projectId, noteId);
      setAvailableFiles(files);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open, projectId, noteId]);

  const handleFileSelect = async (fileId: string) => {
    setAddingFileId(fileId);
    try {
      const success = await addFileToNote(noteId, fileId);
      if (success) {
        onFileAdded();
        loadFiles(); // Refresh available files
      }
    } finally {
      setAddingFileId(null);
    }
  };

  const handleRemoveFile = async (relationshipId: string) => {
    setRemovingFileId(relationshipId);
    try {
      const success = await removeFileFromNote(relationshipId);
      if (success) {
        onFileAdded();
        loadFiles(); // Refresh available files after removal
      }
    } finally {
      setRemovingFileId(null);
    }
  };

  const filteredAvailableFiles = availableFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRelatedFiles = relatedFiles.filter(rel => 
    rel.file?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const buttonText = relatedFiles.length > 0 ? "Manage Files" : "Add Files";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          <span>{buttonText}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Manage Files</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          {loading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-2">
                <h3 className="text-sm font-medium mb-2">Available Files</h3>
                {filteredAvailableFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchTerm ? 'No files match your search' : 'No available files to add'}
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {filteredAvailableFiles.map(file => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-2 bg-secondary/30 rounded-md hover:bg-secondary/50 cursor-pointer"
                          onClick={() => handleFileSelect(file.id)}
                        >
                          <div className="flex items-center space-x-2">
                            {file.type === 'image' ? (
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                <img 
                                  src={file.file_path} 
                                  alt={file.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded">
                                {getFileIcon(file.type)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium">{file.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">{file.type}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            disabled={addingFileId === file.id}
                          >
                            {addingFileId === file.id ? (
                              <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-primary animate-spin" />
                            ) : (
                              <Plus size={16} />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              
              <div className="border rounded-md p-2">
                <h3 className="text-sm font-medium mb-2">Related Files</h3>
                {filteredRelatedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchTerm ? 'No related files match your search' : 'No files associated with this note'}
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {filteredRelatedFiles.map((rel) => (
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
                            <div>
                              <div className="text-sm font-medium truncate">{rel.file?.name || 'Unknown file'}</div>
                              <div className="text-xs text-muted-foreground capitalize">{rel.file_type || 'file'}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(rel.id);
                            }}
                            disabled={removingFileId === rel.id}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            {removingFileId === rel.id ? (
                              <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-muted-foreground animate-spin" />
                            ) : (
                              <X size={16} />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button
            type="button"
            variant="primary"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePicker;
