
import { useState, useEffect } from 'react';
import { File, Music, Folder, FileText, Plus } from 'lucide-react';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { fetchAvailableFiles, addFileToNote } from '@/utils/noteFileRelationshipUtils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui-elements/Button';

interface FilePickerProps {
  projectId: string;
  noteId: string;
  onFileAdded: () => void;
}

const FilePicker = ({ projectId, noteId, onFileAdded }: FilePickerProps) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const loadFiles = async () => {
    setLoading(true);
    try {
      const availableFiles = await fetchAvailableFiles(projectId, noteId);
      setFiles(availableFiles);
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
    const success = await addFileToNote(noteId, fileId);
    if (success) {
      onFileAdded();
      loadFiles(); // Refresh available files
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          <span>Add Files</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Files to Note</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          {loading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No files match your search' : 'No available files to add'}
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {filteredFiles.map(file => (
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
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePicker;
