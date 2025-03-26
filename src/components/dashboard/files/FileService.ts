
import { supabase } from '@/integrations/supabase/client';
import { FileType, ProjectFile } from './FileItem';
import { z } from 'zod';
import { toast } from 'sonner';

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
  let fileSize = 0;

  if (values.file && values.file.length > 0) {
    const file = values.file[0];
    fileSize = file.size;
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
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`${projectId}/${fileName}`);
      
    filePath = urlData.publicUrl;
  } else if (values.type === 'image') {
    throw new Error('You must upload a file for image type.');
  } else {
    filePath = 'audio';
  }

  const { data: posData, error: posError } = await supabase
    .from('files')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = posData && posData.length > 0 && posData[0].position 
    ? posData[0].position + 1 
    : 1;

  const { error } = await supabase
    .from('files')
    .insert({
      name: values.title,
      description: values.description || null,
      file_path: filePath,
      type: values.type,
      project_id: projectId,
      user_id: session.session.user.id,
      position: nextPosition,
      size: fileSize
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
  try {
    // Step 1: First check if there are any image descriptions for this file
    const { data: imageDescData, error: imageDescQueryError } = await supabase
      .from('image_descriptions')
      .select('id')
      .eq('file_id', file.id);
      
    if (imageDescQueryError) {
      console.error('Error checking image descriptions:', imageDescQueryError);
      throw imageDescQueryError;
    }
    
    // Step 2: Delete any associated image descriptions if they exist
    if (imageDescData && imageDescData.length > 0) {
      console.log(`Found ${imageDescData.length} image descriptions to delete`);
      
      const { error: imageDescError } = await supabase
        .from('image_descriptions')
        .delete()
        .eq('file_id', file.id);
  
      if (imageDescError) {
        console.error('Error deleting image descriptions:', imageDescError);
        throw imageDescError;
      }
    }

    // Step 3: Check for and delete any note_file_relationships
    const { data: relationshipData, error: relationshipQueryError } = await supabase
      .from('note_file_relationships')
      .select('id')
      .eq('file_id', file.id);
      
    if (relationshipQueryError) {
      console.error('Error checking note file relationships:', relationshipQueryError);
      throw relationshipQueryError;
    }
    
    if (relationshipData && relationshipData.length > 0) {
      console.log(`Found ${relationshipData.length} file relationships to delete`);
      
      const { error: relationshipError } = await supabase
        .from('note_file_relationships')
        .delete()
        .eq('file_id', file.id);
  
      if (relationshipError) {
        console.error('Error deleting note file relationships:', relationshipError);
        throw relationshipError;
      }
    }

    // Step 4: Now delete the actual file storage if it exists
    if (file.file_path && file.file_path !== 'audio') {
      const bucketName = file.type === 'image' ? 'pub_images' : 'pub_audio';
      
      try {
        const urlPath = new URL(file.file_path).pathname;
        const storagePath = urlPath.split('/').slice(2).join('/');
        
        console.log('Deleting file from storage:', storagePath);
        
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([storagePath]);
          
        if (storageError) {
          console.error('Storage removal error:', storageError);
          // Continue even if storage deletion fails
        }
      } catch (error) {
        console.error('Error parsing file path:', error);
        // Continue even if there's an error with the file path
      }
    }

    // Step 5: Finally delete the file record
    console.log('Deleting file record with ID:', file.id);
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);

    if (error) {
      console.error('Error deleting file record:', error);
      throw error;
    }
    
    console.log('File successfully deleted');
  } catch (error) {
    console.error('Error in deleteFile function:', error);
    throw error;
  }
};

export const bulkUploadFiles = async (
  files: File[], 
  projectId: string
): Promise<number> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    throw new Error('User must be logged in to add files.');
  }

  let successCount = 0;
  
  const { data: posData } = await supabase
    .from('files')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1);

  let nextPosition = posData && posData.length > 0 && posData[0].position 
    ? posData[0].position + 1 
    : 1;

  for (const file of files) {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
      const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExt);
      
      if (!isImage && !isAudio) {
        toast(`${file.name} is not a supported file type.`, {
          description: 'Only images and audio files are supported.'
        });
        continue;
      }
      
      const type: FileType = isImage ? 'image' : 'audio';
      const bucketName = type === 'image' ? 'pub_images' : 'pub_audio';
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(`${projectId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${projectId}/${fileName}`);
        
      const filePath = urlData.publicUrl;
      
      const { error } = await supabase
        .from('files')
        .insert({
          name: file.name,
          description: null,
          file_path: filePath,
          type,
          project_id: projectId,
          user_id: session.session.user.id,
          position: nextPosition++,
          size: file.size
        });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      successCount++;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      toast(`Failed to upload ${file.name}`, {
        description: 'There was an error processing the file.'
      });
    }
  }

  return successCount;
};

export const loadFilesFromDriveLink = async (
  driveLink: string,
  projectId: string
): Promise<number> => {
  try {
    toast('This feature requires backend integration with Google Drive API');
    
    return 0;
  } catch (error) {
    console.error('Error loading files from Google Drive:', error);
    throw error;
  }
};
