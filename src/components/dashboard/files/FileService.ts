
import { supabase } from '@/integrations/supabase/client';
import { FileType, ProjectFile } from './FileItem';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['image', 'audio']),
  file: z.any().optional(),
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

  // For audio type, we don't require a file upload anymore
  if (values.type === 'audio') {
    filePath = 'audio'; // Placeholder value if no file is uploaded
    
    // But if a file was uploaded, process it
    if (values.file && values.file.length > 0) {
      const file = values.file[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pub_audio')
        .upload(`${projectId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('pub_audio')
        .getPublicUrl(`${projectId}/${fileName}`);
        
      filePath = urlData.publicUrl;
    }
  }
  // For image type, upload the file (required)
  else if (values.type === 'image') {
    if (!values.file || values.file.length === 0) {
      throw new Error('You must upload a file for image type.');
    }
    
    const file = values.file[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pub_images')
      .upload(`${projectId}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('pub_images')
      .getPublicUrl(`${projectId}/${fileName}`);
      
    filePath = urlData.publicUrl;
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

export const updateFile = async (fileId: string, values: Omit<FileFormValues, 'file'>): Promise<void> => {
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
  // If the file is a real file with a URL (not just a placeholder)
  if (file.file_path && file.file_path !== 'audio') {
    const bucketName = file.type === 'image' ? 'pub_images' : 'pub_audio';
    
    try {
      // Extract the file path from the URL
      const urlPath = new URL(file.file_path).pathname;
      const storagePath = urlPath.split('/').slice(2).join('/');
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([storagePath]);
        
      if (storageError) console.error('Storage removal error:', storageError);
    } catch (error) {
      console.error('Error parsing file path:', error);
    }
  }

  // Delete metadata
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', file.id);

  if (error) throw error;
};
