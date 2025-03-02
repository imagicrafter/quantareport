
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash, Upload, Folder } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Button from '../ui-elements/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Define file types as a more specific type
type FileType = 'image' | 'audio' | 'folder';

interface ProjectFile {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  type: FileType;
  created_at: string;
}

interface FilesSectionProps {
  projectId: string;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio', 'folder']),
  file: z.any().optional(),
  folderLink: z.string().optional(),
});

const FilesSection = ({ projectId }: FilesSectionProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'image',
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'image',
    },
  });

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Explicitly cast the type to make TypeScript happy
      setFiles(data.map(file => ({
        ...file,
        type: file.type as FileType
      })) as ProjectFile[]);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  const handleAddFile = async (values: z.infer<typeof formSchema>) => {
    try {
      setUploading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add files.',
          variant: 'destructive',
        });
        return;
      }

      let filePath = '';

      // For folder type, use the folderLink value
      if (values.type === 'folder') {
        if (!values.folderLink) {
          toast({
            title: 'Error',
            description: 'You must provide a folder link.',
            variant: 'destructive',
          });
          return;
        }
        filePath = values.folderLink;
      } 
      // For image or audio, upload the file
      else if (values.file && values.file.length > 0) {
        const file = values.file[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const bucketName = values.type === 'image' ? 'pub_images' : 'pub_audio';
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`${projectId}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${projectId}/${fileName}`);
          
        filePath = urlData.publicUrl;
      } else {
        toast({
          title: 'Error',
          description: 'You must upload a file.',
          variant: 'destructive',
        });
        return;
      }

      // Save file metadata to database
      const { error } = await supabase
        .from('files')
        .insert({
          name: values.title,
          description: values.description || null,
          file_path: filePath,
          type: values.type,
          project_id: projectId,
          user_id: session.session.user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File added successfully!',
      });

      form.reset();
      setIsAddDialogOpen(false);
      fetchFiles();
    } catch (error) {
      console.error('Error adding file:', error);
      toast({
        title: 'Error',
        description: 'Failed to add file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditFile = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // Update only the metadata
      const { error } = await supabase
        .from('files')
        .update({
          name: values.title,
          description: values.description || null,
        })
        .eq('id', selectedFile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File updated successfully!',
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      fetchFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      toast({
        title: 'Error',
        description: 'Failed to update file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // If the file is in storage (not a folder link), delete it first
      if (selectedFile.type !== 'folder') {
        const bucketName = selectedFile.type === 'image' ? 'pub_images' : 'pub_audio';
        
        // Extract the file path from the URL
        const urlPath = new URL(selectedFile.file_path).pathname;
        const storagePath = urlPath.split('/').slice(2).join('/');
        
        // Delete file from storage
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([storagePath]);
          
        if (storageError) console.error('Storage removal error:', storageError);
      }

      // Delete metadata
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', selectedFile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File deleted successfully!',
      });

      setIsDeleteDialogOpen(false);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper to get file type icon
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <div className="p-1 bg-blue-100 rounded-full"><Upload size={16} className="text-blue-500" /></div>;
      case 'audio':
        return <div className="p-1 bg-purple-100 rounded-full"><Upload size={16} className="text-purple-500" /></div>;
      case 'folder':
        return <div className="p-1 bg-yellow-100 rounded-full"><Folder size={16} className="text-yellow-600" /></div>;
      default:
        return <div className="p-1 bg-gray-100 rounded-full"><Upload size={16} className="text-gray-500" /></div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Files</h3>
        <Button 
          size="sm" 
          onClick={() => {
            form.reset();
            setIsAddDialogOpen(true);
          }}
        >
          <PlusCircle size={16} className="mr-2" />
          Add File
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-lg">
          No files added yet. Add your first file to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileTypeIcon(file.type)}
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{file.type}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedFile(file);
                    editForm.reset({
                      title: file.name,
                      description: file.description || '',
                      type: file.type,
                    });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedFile(file);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add File Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add File</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddFile)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter file title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter description" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Type</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="image" id="image" />
                          <Label htmlFor="image">Image</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="audio" id="audio" />
                          <Label htmlFor="audio">Audio</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="folder" id="folder" />
                          <Label htmlFor="folder">Google Drive Folder</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('type') === 'folder' ? (
                <FormField
                  control={form.control}
                  name="folderLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Drive Folder Link</FormLabel>
                      <FormControl>
                        <Input placeholder="Paste shared Google Drive folder link" {...field} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-1">
                        Make sure the folder is shared and accessible.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept={form.watch('type') === 'image' ? 'image/*' : 'audio/*'}
                          onChange={(e) => onChange(e.target.files)}
                          {...fieldProps} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  isLoading={uploading}
                >
                  Add File
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditFile)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter file title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter description" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  isLoading={uploading}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p>Are you sure you want to delete this file? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="primary"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteFile}
              isLoading={uploading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilesSection;
