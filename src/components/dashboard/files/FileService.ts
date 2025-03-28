
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile, FileType } from './FileItem';
import { formatFileSize } from '@/utils/fileUtils';

export interface FileFormValues {
  name: string;
  title?: string;
  description?: string;
  file?: File;
  file_path?: string;
  type: FileType;
}

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
  
  console.log('Fetched files:', data);
  
  return data.map(file => ({
    ...file,
    type: file.type as FileType
  })) as ProjectFile[];
};

export const addFile = async (values: FileFormValues, projectId: string): Promise<ProjectFile> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    throw new Error('No active session found');
  }
  
  const userId = session.session.user.id;
  let filePath = values.file_path;
  
  // Upload file if provided
  if (values.file) {
    const file = values.file;
    // Check if the filename exists before attempting to split it
    const fileExt = file.name ? file.name.split('.').pop() : '';
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    let bucketName = 'pub_documents';
    
    // Determine bucket based on file type
    if (values.type === 'image') {
      bucketName = 'pub_images';
    } else if (values.type === 'audio') {
      bucketName = 'pub_audio';
    } else if (values.type === 'text') {
      bucketName = 'pub_documents';
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
      
    filePath = urlData.publicUrl;
  }
  
  // Get position value
  const { data: positionData } = await supabase
    .from('files')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1);
    
  const position = positionData && positionData.length > 0 
    ? (positionData[0].position || 0) + 1 
    : 1;
  
  // Insert file record in database
  const { data, error } = await supabase
    .from('files')
    .insert({
      name: values.title || values.name, // Use title if provided, otherwise use name
      description: values.description || '',
      file_path: filePath,
      type: values.type,
      project_id: projectId,
      user_id: userId,
      position: position,
      size: values.file ? values.file.size : 0
    })
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as ProjectFile;
};

export const updateFile = async (fileId: string, values: FileFormValues): Promise<ProjectFile> => {
  let filePath = values.file_path;
  
  // Upload new file if provided
  if (values.file) {
    // First, get the existing file to know its project_id
    const { data: existingFile, error: fetchError } = await supabase
      .from('files')
      .select('project_id, file_path')
      .eq('id', fileId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    const projectId = existingFile.project_id;
    const file = values.file;
    // Check if the filename exists before attempting to split it
    const fileExt = file.name ? file.name.split('.').pop() : '';
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    let bucketName = 'pub_documents';
    
    // Determine bucket based on file type
    if (values.type === 'image') {
      bucketName = 'pub_images';
    } else if (values.type === 'audio') {
      bucketName = 'pub_audio';
    } else if (values.type === 'text') {
      bucketName = 'pub_documents';
    }
    
    // Delete old file if it was stored in our bucket
    if (existingFile.file_path && existingFile.file_path.includes(bucketName)) {
      const oldFilePath = existingFile.file_path.split('/').pop();
      if (oldFilePath) {
        await supabase.storage
          .from(bucketName)
          .remove([`${projectId}/${oldFilePath}`]);
      }
    }
    
    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`${projectId}/${fileName}`, file);
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(`${projectId}/${fileName}`);
      
    filePath = urlData.publicUrl;
  }
  
  // Update file record
  const { data, error } = await supabase
    .from('files')
    .update({
      name: values.title || values.name, // Use title if provided, otherwise use name
      description: values.description,
      file_path: filePath,
      type: values.type,
      size: values.file ? values.file.size : undefined
    })
    .eq('id', fileId)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as ProjectFile;
};

export const deleteFile = async (file: ProjectFile): Promise<void> => {
  // Delete file from storage if it's stored in our buckets
  if (file.file_path) {
    const projectId = file.project_id;
    let bucketName = '';
    
    if (file.file_path.includes('pub_images')) {
      bucketName = 'pub_images';
    } else if (file.file_path.includes('pub_audio')) {
      bucketName = 'pub_audio';
    } else if (file.file_path.includes('pub_documents')) {
      bucketName = 'pub_documents';
    }
    
    if (bucketName) {
      const filePath = file.file_path.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from(bucketName)
          .remove([`${projectId}/${filePath}`]);
      }
    }
  }
  
  // Delete file record
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', file.id);
    
  if (error) {
    throw error;
  }
};

export const bulkUploadFiles = async (files: File[], projectId: string): Promise<number> => {
  let successCount = 0;
  
  for (const file of files) {
    try {
      // Determine file type based on extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let fileType: FileType = 'other';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        fileType = 'image';
      } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
        fileType = 'audio';
      } else if (['txt', 'md', 'doc', 'docx'].includes(extension)) {
        fileType = 'text';
      }
      
      // Create file values
      const fileValues: FileFormValues = {
        name: file.name,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        file: file,
        type: fileType
      };
      
      // Add file
      await addFile(fileValues, projectId);
      successCount++;
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      // Continue with next file
    }
  }
  
  return successCount;
};

export const loadFilesFromDriveLink = async (link: string, projectId: string): Promise<number> => {
  // This is a placeholder for the Google Drive integration
  // In a real implementation, this would connect to Google Drive API
  // and download files from the provided link
  
  console.log('Google Drive link integration:', link);
  
  // Return 0 to indicate no files were processed
  // This will trigger the toast notification about backend integration
  return 0;
};
