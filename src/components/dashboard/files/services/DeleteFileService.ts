
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '../FileItem';

export const deleteFile = async (file: ProjectFile): Promise<void> => {
  try {
    // First delete file from storage if it's stored in our buckets
    if (file.file_path) {
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
        // Get the file name from the path
        const fileName = file.file_path.split('/').pop();
        
        if (!fileName) {
          console.error('Could not extract filename from path:', file.file_path);
        } else {
          // The correct storage path format should be: {projectId}/{fileName}
          const filePathInBucket = `${projectId}/${fileName}`;
          
          console.log(`Attempting to delete file from storage: ${bucketName}/${filePathInBucket}`);
          
          // Use the Supabase storage API to delete the file
          const { data, error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([filePathInBucket]);
            
          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            throw new Error(`Failed to delete file from storage: ${storageError.message}`);
          } else {
            console.log('Successfully deleted file from storage:', data);
          }
        }
      } else {
        console.log('File is not stored in a recognized bucket:', file.file_path);
      }
    }
    
    // Now delete the file record from the database
    try {
      // First delete any note-file relationships
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
  } catch (error) {
    console.error('Error in deleteFile function:', error);
    throw error;
  }
};
