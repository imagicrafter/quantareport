
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '../FileItem';
import { FileFormValues } from '../types/FileTypes';
import { uploadFileToStorage } from './FileUploadService';

export const addFile = async (values: FileFormValues, projectId: string): Promise<ProjectFile> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    throw new Error('No active session found');
  }
  
  const userId = session.session.user.id;
  let filePath = values.file_path;
  let fileContent = null;
  
  // Upload file if provided
  if (values.file) {
    const uploadResult = await uploadFileToStorage(values.file, projectId, values.type);
    filePath = uploadResult.filePath;
    fileContent = uploadResult.fileContent;
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
      size: values.file ? values.file.size : 0,
      // Add file content in metadata for text files
      metadata: fileContent ? { content: fileContent } : null
    })
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as ProjectFile;
};
