
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '../FileItem';

export const deleteFile = async (file: ProjectFile): Promise<void> => {
  // First delete file from storage if it's stored in our buckets
  if (file.file_path) {
    try {
      const projectId = file.project_id;
      let bucketName = '';
      
      // Determine which bucket the file is stored in based on file path
      if (file.file_path.includes('pub_images')) {
        bucketName = 'pub_images';
      } else if (file.file_path.includes('pub_audio')) {
        bucketName = 'pub_audio';
      } else if (file.file_path.includes('pub_documents')) {
        bucketName = 'pub_documents';
      }
      
      if (bucketName) {
        // Extract the file path after the bucket name and project ID
        // The storage path format is typically: {bucketName}/{projectId}/{filename}
        const pathSegments = file.file_path.split('/');
        const filePathInBucket = `${projectId}/${pathSegments[pathSegments.length - 1]}`;
        
        console.log(`Deleting file from storage: ${bucketName}/${filePathInBucket}`);
        
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([filePathInBucket]);
          
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
    } catch (error) {
      console.error('Error processing file storage deletion:', error);
      // Continue with database deletion even if there's an error with storage deletion
    }
  }
  
  // Now delete the file record from the database
  try {
    // Also delete any note-file relationships
    const { error: relationshipError } = await supabase
      .from('note_file_relationships')
      .delete()
      .eq('file_id', file.id);
      
    if (relationshipError) {
      console.error('Error deleting note-file relationships:', relationshipError);
    }
    
    // Delete the file record
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file record:', error);
    throw error;
  }
};
