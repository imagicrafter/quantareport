
import { useState, useEffect } from 'react';
import { File, Music, Folder, FileText, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface FilePickerProps {
  projectId: string;
  noteId: string;
  onFileAdded: (newRelationship?: NoteFileRelationshipWithType) => void;
  relatedFiles: NoteFileRelationshipWithType[];
}

const FilePicker = ({ projectId, noteId, onFileAdded, relatedFiles }: FilePickerProps) => {
  const [open, setOpen] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [addingFileId, setAddingFileId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewableImages, setPreviewableImages] = useState<{path: string, title: string}[]>([]);
  
  const loadFiles = async () => {
    setLoading(true);
    try {
      // Only fetch available files if noteId is a valid UUID (not a temp ID)
      if (noteId && !noteId.startsWith('temp-')) {
        const files = await fetchAvailableFiles(projectId, noteId);
        setAvailableFiles(files);
      } else {
        // For temporary notes, fetch all project files
        const { data: files, error } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId)
          .order('position', { ascending: true });
          
        if (error) throw error;
        
        // Filter out any files that are already in the relatedFiles array
        const relatedFileIds = relatedFiles.map(rel => rel.file_id);
        const filteredFiles = (files as ProjectFile[]).filter(
          file => !relatedFileIds.includes(file.id)
        );
        
        setAvailableFiles(filteredFiles);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open, projectId, noteId, relatedFiles]);

  // Prepare previewable images when related files change
  useEffect(() => {
    const images = [
      ...relatedFiles.filter(rel => rel.file_type === 'image').map(rel => ({
        path: rel.file_path,
        title: rel.file?.name || 'Image'
      })),
      ...availableFiles.filter(file => file.type === 'image').map(file => ({
        path: file.file_path,
        title: file.name
      }))
    ];
    setPreviewableImages(images);
  }, [relatedFiles, availableFiles]);

  const handleFileSelect = async (fileId: string, selectedFile: ProjectFile) => {
    setAddingFileId(fileId);
    try {
      if (noteId && !noteId.startsWith('temp-')) {
        const success = await addFileToNote(noteId, fileId);
        if (success) {
          onFileAdded();
          loadFiles(); // Refresh available files
        }
      } else {
        // For temporary notes, create a temporary relationship
        const tempRelationship: NoteFileRelationshipWithType = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          note_id: noteId,
          file_id: fileId,
          created_at: new Date().toISOString(),
          file: selectedFile,
          file_type: selectedFile.type,
          file_path: selectedFile.file_path
        };
        
        // Remove the file from the available files
        setAvailableFiles(prev => prev.filter(file => file.id !== fileId));
        
        // Pass the new relationship to the parent component
        onFileAdded(tempRelationship);
      }
    } finally {
      setAddingFileId(null);
    }
  };

  const handleRemoveFile = async (relationshipId: string) => {
    setRemovingFileId(relationshipId);
    try {
      if (!relationshipId.startsWith('temp-')) {
        const success = await removeFileFromNote(relationshipId);
        if (success) {
          onFileAdded();
          loadFiles(); // Refresh available files after removal
        }
      } else {
        // For temporary relationships, find the relationship and get the file
        const relationship = relatedFiles.find(rel => rel.id === relationshipId);
        if (relationship) {
          // Add the file back to available files if it's not already there
          const fileAlreadyAvailable = availableFiles.some(file => file.id === relationship.file_id);
          if (!fileAlreadyAvailable && relationship.file) {
            setAvailableFiles(prev => [...prev, relationship.file!]);
          }
          // Notify the parent component about the removal
          onFileAdded();
        }
      }
    } finally {
      setRemovingFileId(null);
    }
  };

  const handleImagePreview = (imagePath: string, title: string) => {
    setPreviewImage(imagePath);
    setPreviewTitle(title);
    
    // Find the index of this image in the previewable images array
    const index = previewableImages.findIndex(img => img.path === imagePath);
    if (index !== -1) {
      setCurrentImageIndex(index);
    }
    
    setPreviewOpen(true);
  };

  const handlePreviousImage = () => {
    if (previewableImages.length <= 1) return;
    
    const newIndex = currentImageIndex > 0 
      ? currentImageIndex - 1 
      : previewableImages.length - 1;
      
    setCurrentImageIndex(newIndex);
    setPreviewImage(previewableImages[newIndex].path);
    setPreviewTitle(previewableImages[newIndex].title);
  };

  const handleNextImage = () => {
    if (previewableImages.length <= 1) return;
    
    const newIndex = currentImageIndex < previewableImages.length - 1 
      ? currentImageIndex + 1 
      : 0;
      
    setCurrentImageIndex(newIndex);
    setPreviewImage(previewableImages[newIndex].path);
    setPreviewTitle(previewableImages[newIndex].title);
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
    <>
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
                            className="flex items-center justify-between p-2 bg-secondary/30 rounded-md hover:bg-secondary/50"
                          >
                            <div 
                              className="flex items-center space-x-2 cursor-pointer flex-1"
                              onClick={() => file.type === 'image' && handleImagePreview(file.file_path, file.name)}
                            >
                              {file.type === 'image' ? (
                                <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer">
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
                              className="ml-2 group"
                              disabled={addingFileId === file.id}
                              onClick={() => handleFileSelect(file.id, file)}
                            >
                              {addingFileId === file.id ? (
                                <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-primary animate-spin" />
                              ) : (
                                <Plus size={16} className="text-muted-foreground group-hover:text-green-500 transition-colors" />
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
                            <div 
                              className="flex items-center space-x-2 flex-1 cursor-pointer"
                              onClick={() => rel.file_type === 'image' && handleImagePreview(rel.file_path, rel.file?.name || 'Image')}
                            >
                              {rel.file_type === 'image' ? (
                                <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer">
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

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden relative">
            {previewImage && (
              <div className="p-4 flex items-center justify-center h-full">
                <img 
                  src={previewImage} 
                  alt={previewTitle}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            )}
            
            {previewableImages.length > 1 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              {previewableImages.length > 0 ? `${currentImageIndex + 1} / ${previewableImages.length}` : ''}
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePicker;
