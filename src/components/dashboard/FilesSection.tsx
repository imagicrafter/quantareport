
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash, File, Image, Music, Link } from 'lucide-react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Button from '../ui-elements/Button';

interface FilesSectionProps {
  projectId: string;
}

type FileType = 'image' | 'audio' | 'folder';

interface ProjectFile {
  id: string;
  name: string;
  description: string;
  type: FileType;
  file_path: string;
  created_at: string;
}

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio', 'folder']),
  folderLink: z.string().url('Please enter a valid URL').optional(),
  file: z.any().optional()
}).refine(data => {
  if (data.type === 'folder' && !data.folderLink) {
    return false;
  }
  if ((data.type === 'image' || data.type === 'audio') && !data.file) {
    return false;
  }
  return true;
}, {
  message: "Please provide required fields for the selected type",
  path: ["file"] // This is arbitrary and will show under the file field
});

const FilesSection = ({ projectId }: FilesSectionProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'image',
      folderLink: '',
    }
  });

  const fileType = form.watch('type');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert the raw data to ProjectFile type with the correct type casting
      const typedFiles: ProjectFile[] = (data || []).map(file => ({
        ...file,
        type: file.type as FileType, // Cast the string to our union type
      }));
      
      setFiles(typedFiles);
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
    fetchFiles();
  }, [projectId]);

  const handleAddFile = () => {
    form.reset({
      title: '',
      description: '',
      type: 'image',
      folderLink: '',
    });
    setFileToUpload(null);
    setIsEditing(false);
    setCurrentFileId(null);
    setIsDialogOpen(true);
  };

  const handleEditFile = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;
      
      form.reset({
        title: data.name,
        description: data.description || '',
        type: data.type as FileType, // Cast to our union type
        folderLink: data.type === 'folder' ? data.file_path : '',
      });
      
      setIsEditing(true);
      setCurrentFileId(fileId);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching file for edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFile = async (fileId: string, fileType: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      // First delete the file entry from the database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
      
      // If it's a file (not a folder link), remove from storage
      if (fileType !== 'folder') {
        const bucketId = fileType === 'image' ? 'pub_images' : 'pub_audio';
        const { error: storageError } = await supabase
          .storage
          .from(bucketId)
          .remove([filePath]);
          
        if (storageError) {
          console.error('Error removing file from storage:', storageError);
          // Continue anyway as we've already removed the database entry
        }
      }
      
      toast({
        title: 'Success',
        description: 'File deleted successfully!'
      });
      
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to upload files.',
          variant: 'destructive',
        });
        return;
      }

      let filePath = '';

      // Handle file or folder path
      if (values.type === 'folder') {
        // For folders, just use the provided Google Drive link
        filePath = values.folderLink || '';
      } else if (fileToUpload) {
        // For files, upload to appropriate bucket
        const bucketId = values.type === 'image' ? 'pub_images' : 'pub_audio';
        const fileExt = fileToUpload.name.split('.').pop();
        const uniqueFilePath = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from(bucketId)
          .upload(uniqueFilePath, fileToUpload);

        if (uploadError) throw uploadError;
        filePath = uniqueFilePath;
      }

      if (isEditing && currentFileId) {
        // Update existing file metadata
        const { error } = await supabase
          .from('files')
          .update({
            name: values.title,
            description: values.description,
            // Only update file_path if a new file is uploaded or folder link changed
            ...(filePath ? { file_path: filePath } : {})
          })
          .eq('id', currentFileId);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'File updated successfully!'
        });
      } else {
        // Create new file entry
        const { error } = await supabase
          .from('files')
          .insert({
            name: values.title,
            description: values.description,
            file_path: filePath,
            type: values.type,
            project_id: projectId,
            user_id: session.session.user.id
          });

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'File created successfully!'
        });
      }
      
      setIsDialogOpen(false);
      form.reset();
      setFileToUpload(null);
      fetchFiles();
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: 'Error',
        description: 'Failed to save file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileToUpload(files[0]);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return <Image size={16} />;
      case 'audio': return <Music size={16} />;
      case 'folder': return <Link size={16} />;
      default: return <File size={16} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Files</h3>
        <Button 
          variant="outline" 
          size="sm" 
          icon={<Plus size={16} />}
          onClick={handleAddFile}
        >
          Add File
        </Button>
      </div>
      
      {loading ? (
        <div className="py-4 text-center">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No files found. Add your first file to this project.
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="border rounded-md p-4 bg-card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.type)}
                  <h4 className="font-medium">{file.name}</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditFile(file.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id, file.type, file.file_path)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  {new Date(file.created_at).toLocaleString()}
                </p>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                  {file.type.charAt(0).toUpperCase() + file.type.slice(1)}
                </span>
              </div>
              {file.description && <p className="mt-2 text-sm line-clamp-2">{file.description}</p>}
              {file.type === 'folder' && (
                <a 
                  href={file.file_path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                >
                  <Link size={14} className="mr-1" /> Open in Google Drive
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit File' : 'Add File'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter file description" 
                        className="min-h-[80px]" 
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
                  <FormItem className="space-y-1">
                    <FormLabel>File Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="image" id="image" />
                          <Label htmlFor="image" className="flex items-center">
                            <Image size={16} className="mr-2" /> Image
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="audio" id="audio" />
                          <Label htmlFor="audio" className="flex items-center">
                            <Music size={16} className="mr-2" /> Audio
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="folder" id="folder" />
                          <Label htmlFor="folder" className="flex items-center">
                            <Link size={16} className="mr-2" /> Google Drive Folder
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {fileType === 'folder' ? (
                <FormField
                  control={form.control}
                  name="folderLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Drive Folder Link</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://drive.google.com/drive/folders/..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Make sure the folder is shared and accessible.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload {fileType === 'image' ? 'Image' : 'Audio'} File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept={fileType === 'image' ? 'image/*' : 'audio/*'}
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {form.formState.errors.file && (
                    <p className="text-sm font-medium text-destructive">
                      Please select a file to upload
                    </p>
                  )}
                  {fileToUpload && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              )}
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                >
                  {isEditing ? 'Update File' : 'Save File'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilesSection;
