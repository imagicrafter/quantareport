
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '../FileItem';

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
