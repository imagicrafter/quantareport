
import { supabase } from '@/integrations/supabase/client';
import { FileType, ProjectFile } from './FileItem';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio', 'folder']),
  file: z.any().optional(),
  folderLink: z.string().optional(),
});

export type FileFormValues = z.infer<typeof formSchema>;

export const fetchFiles = async (projectId: string): Promise<ProjectFile[]> => {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(file => ({
    ...file,
    type: file.type as FileType
  })) as ProjectFile[];
};

export const addFile = async (values: FileFormValues, projectId: string): Promise<void> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    throw new Error('User must be logged in to add files.');
  }

  let filePath = '';

  // For folder type, use the folderLink value
  if (values.type === 'folder') {
    if (!values.folderLink) {
      throw new Error('You must provide a folder link.');
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
    throw new Error('You must upload a file.');
  }

  // Get the max position for this project to place new file at the end
  const { data: posData, error: posError } = await supabase
    .from('files')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = posData && posData.length > 0 && posData[0].position 
    ? posData[0].position + 1 
    : 1;

  // Save file metadata to database
  const { error } = await supabase
    .from('files')
    .insert({
      name: values.title,
      description: values.description || null,
      file_path: filePath,
      type: values.type,
      project_id: projectId,
      user_id: session.session.user.id,
      position: nextPosition
    });

  if (error) throw error;
};

export const updateFile = async (fileId: string, values: Omit<FileFormValues, 'file' | 'folderLink'>): Promise<void> => {
  const { error } = await supabase
    .from('files')
    .update({
      name: values.title,
      description: values.description || null,
    })
    .eq('id', fileId);

  if (error) throw error;
};

export const deleteFile = async (file: ProjectFile): Promise<void> => {
  // If the file is in storage (not a folder link), delete it first
  if (file.type !== 'folder') {
    const bucketName = file.type === 'image' ? 'pub_images' : 'pub_audio';
    
    // Extract the file path from the URL
    const urlPath = new URL(file.file_path).pathname;
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
    .eq('id', file.id);

  if (error) throw error;
};
