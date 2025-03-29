
import { supabase } from '@/integrations/supabase/client';
import { FileFormValues } from '../types/FileTypes';

export const uploadFileToStorage = async (
  file: File,
  projectId: string,
  fileType: string
): Promise<{ filePath: string, fileContent: string | null }> => {
  if (!file) {
    throw new Error('No file provided');
  }

  const fileExt = file.name ? file.name.split('.').pop() : '';
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  let bucketName = 'pub_documents';
  let fileContent = null;
  
  // Determine bucket based on file type
  if (fileType === 'image') {
    bucketName = 'pub_images';
  } else if (fileType === 'audio') {
    bucketName = 'pub_audio';
  } else if (fileType === 'text') {
    bucketName = 'pub_documents';
    
    // For text files, read the content
    if (fileExt && ['txt', 'md', 'doc', 'docx'].includes(fileExt.toLowerCase())) {
      try {
        fileContent = await file.text();
      } catch (error) {
        console.error('Error reading text file:', error);
      }
    }
  }
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(`${projectId}/${fileName}`, file);
    
  if (uploadError) {
    throw uploadError;
  }
  
  // Get public URL
  const { data: urlData } = await supabase.storage
    .from(bucketName)
    .getPublicUrl(`${projectId}/${fileName}`);
    
  return { 
    filePath: urlData.publicUrl,
    fileContent
  };
};
