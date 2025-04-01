
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '../FileItem';
import { FileFormValues } from '../types/FileTypes';
import { uploadFileToStorage } from './FileUploadService';

export const updateFile = async (fileId: string, values: FileFormValues): Promise<ProjectFile> => {
  let filePath = values.file_path;
  let fileContent = null;
  
  // Upload new file if provided
  if (values.file) {
    // First, get the existing file to know its project_id
    const { data: existingFile, error: fetchError } = await supabase
      .from('files')
      .select('project_id, file_path, metadata')
      .eq('id', fileId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    const projectId = existingFile.project_id;
    
    // Determine bucket based on file path
    let bucketName = '';
    if (existingFile.file_path) {
      if (existingFile.file_path.includes('pub_images')) {
        bucketName = 'pub_images';
      } else if (existingFile.file_path.includes('pub_audio')) {
        bucketName = 'pub_audio';
      } else if (existingFile.file_path.includes('pub_documents')) {
        bucketName = 'pub_documents';
      }
      
      // Delete old file if it was stored in our bucket
      if (bucketName) {
        const oldFilePath = existingFile.file_path.split('/').pop();
        if (oldFilePath) {
          await supabase.storage
            .from(bucketName)
            .remove([`${projectId}/${oldFilePath}`]);
        }
      }
    }
    
    // Upload new file
    const uploadResult = await uploadFileToStorage(values.file, projectId, values.type);
    filePath = uploadResult.filePath;
    fileContent = uploadResult.fileContent;
  }
  
  // Update file record
  const { data, error } = await supabase
    .from('files')
    .update({
      name: values.name,
      title: values.title, // Use title directly
      description: values.description,
      file_path: filePath,
      type: values.type,
      size: values.file ? values.file.size : undefined,
      // Update metadata with file content for text files
      metadata: fileContent ? { content: fileContent } : undefined
    })
    .eq('id', fileId)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as ProjectFile;
};
