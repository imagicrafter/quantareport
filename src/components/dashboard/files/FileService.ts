
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
    console.log('Starting deletion process for file:', file.id);
    
    // Step 1: Delete from image_descriptions with more explicit query
    console.log('Checking for image descriptions...');
    const { data: imageDescs, error: fetchImgDescError } = await supabase
      .from('image_descriptions')
      .select('id')
      .eq('file_id', file.id);
      
    if (fetchImgDescError) {
      console.error('Error fetching image descriptions:', fetchImgDescError);
      throw fetchImgDescError;
    }
    
    if (imageDescs && imageDescs.length > 0) {
      console.log(`Found ${imageDescs.length} image descriptions to delete`);
      
      // Use a transaction to ensure all image descriptions are deleted
      for (const desc of imageDescs) {
        console.log(`Deleting image description with ID: ${desc.id}`);
        const { error: deleteImgDescError } = await supabase
          .from('image_descriptions')
          .delete()
          .eq('id', desc.id);
          
        if (deleteImgDescError) {
          console.error(`Error deleting image description ${desc.id}:`, deleteImgDescError);
          throw deleteImgDescError;
        }
      }
      
      // Double-check that all image descriptions were deleted
      const { data: remainingDescs, error: checkError } = await supabase
        .from('image_descriptions')
        .select('id')
        .eq('file_id', file.id);
        
      if (checkError) {
        console.error('Error checking remaining descriptions:', checkError);
      } else if (remainingDescs && remainingDescs.length > 0) {
        console.error(`Still have ${remainingDescs.length} image descriptions after deletion attempt`);
        throw new Error('Failed to delete all image descriptions');
      } else {
        console.log('All image descriptions successfully deleted');
      }
    } else {
      console.log('No image descriptions found for this file');
    }

    // Step 2: Delete from note_file_relationships
    console.log('Checking for note file relationships...');
    const { data: relationships, error: fetchRelError } = await supabase
      .from('note_file_relationships')
      .select('id')
      .eq('file_id', file.id);
      
    if (fetchRelError) {
      console.error('Error fetching note file relationships:', fetchRelError);
      throw fetchRelError;
    }
    
    if (relationships && relationships.length > 0) {
      console.log(`Found ${relationships.length} file relationships to delete`);
      
      for (const rel of relationships) {
        console.log(`Deleting relationship with ID: ${rel.id}`);
        const { error: deleteRelError } = await supabase
          .from('note_file_relationships')
          .delete()
          .eq('id', rel.id);
          
        if (deleteRelError) {
          console.error(`Error deleting relationship ${rel.id}:`, deleteRelError);
          throw deleteRelError;
        }
      }
      console.log('All note file relationships successfully deleted');
    } else {
      console.log('No note file relationships found for this file');
    }

    // Step 3: Check for and remove any other references in other tables
    console.log('Checking for other references to this file...');
    // Check for references in project_images table
    const { data: projectImages, error: projectImagesError } = await supabase
      .from('project_images')
      .select('*')
      .eq('files_id', file.id);
      
    if (projectImagesError) {
      console.error('Error checking project_images:', projectImagesError);
    } else if (projectImages && projectImages.length > 0) {
      console.log(`Found ${projectImages.length} references in project_images`);
      
      const { error: deleteProjectImagesError } = await supabase
        .from('project_images')
        .delete()
        .eq('files_id', file.id);
        
      if (deleteProjectImagesError) {
        console.error('Error deleting from project_images:', deleteProjectImagesError);
        throw deleteProjectImagesError;
      }
      console.log('Successfully deleted project_images references');
    }

    // Step 4: Delete storage file if applicable
    if (file.file_path && file.file_path !== 'audio') {
      try {
        const bucketName = file.type === 'image' ? 'pub_images' : 'pub_audio';
        const urlPath = new URL(file.file_path).pathname;
        const storagePath = urlPath.split('/').slice(2).join('/');
        
        console.log('Deleting file from storage:', storagePath, 'from bucket:', bucketName);
        
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([storagePath]);
          
        if (storageError) {
          console.error('Storage removal error:', storageError);
          // Continue even if storage deletion fails
        } else {
          console.log('Storage file successfully deleted');
        }
      } catch (error) {
        console.error('Error parsing file path:', error);
        // Continue even if there's an error with the file path
      }
    }

    // Step 5: Final check before file record deletion
    console.log('Performing final check for any remaining references...');
    const { data: finalImageDescs, error: finalCheckError } = await supabase
      .from('image_descriptions')
      .select('id')
      .eq('file_id', file.id);
      
    if (finalCheckError) {
      console.error('Error in final image_descriptions check:', finalCheckError);
    } else if (finalImageDescs && finalImageDescs.length > 0) {
      console.error(`Still found ${finalImageDescs.length} image descriptions after deletion attempts`);
      throw new Error('Failed to delete all image descriptions references');
    } else {
      console.log('Final check passed: No remaining image_descriptions references');
    }

    // Step 6: Finally delete the file record
    console.log('Deleting file record with ID:', file.id);
    const { error: deleteFileError } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);

    if (deleteFileError) {
      console.error('Error deleting file record:', deleteFileError);
      throw deleteFileError;
    }
    
    console.log('File record successfully deleted');
    
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
