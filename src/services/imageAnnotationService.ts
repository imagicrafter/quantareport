
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Saves an annotated image and creates a new file record
 */
export const saveAnnotatedImage = async (
  file: File,
  projectId: string,
  parentFileId: string
): Promise<string> => {
  try {
    console.log("Starting saveAnnotatedImage:", {
      fileName: file.name,
      fileSize: file.size,
      projectId,
      parentFileId
    });
    
    // 1. Get user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      const error = new Error('No active session found');
      console.error('Authentication error:', error);
      throw error;
    }
    console.log("User session verified");
    
    // 2. Upload file to storage
    const fileName = `annotated_${Date.now()}_${file.name}`;
    const storagePath = `${projectId}/${fileName}`;
    console.log("Uploading file to storage path:", storagePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pub_images')
      .upload(storagePath, file);
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    console.log("File uploaded successfully:", uploadData);
    
    // 3. Get public URL
    const { data: urlData } = await supabase.storage
      .from('pub_images')
      .getPublicUrl(storagePath);
      
    const filePath = urlData.publicUrl;
    console.log("Public URL generated:", filePath);
    
    // 4. Get position value for new file
    const { data: positionData } = await supabase
      .from('files')
      .select('position')
      .eq('project_id', projectId)
      .order('position', { ascending: false })
      .limit(1);
      
    const position = positionData && positionData.length > 0 
      ? (positionData[0].position || 0) + 1 
      : 1;
    console.log("New file position:", position);
    
    // 5. Get parent file information
    const { data: parentFile, error: parentError } = await supabase
      .from('files')
      .select('name, type')
      .eq('id', parentFileId)
      .single();
      
    if (parentError) {
      console.error('Error fetching parent file:', parentError);
    } else {
      console.log("Parent file information:", parentFile);
    }
    
    // 6. Insert new file record with parent_file_id
    console.log("Creating new file record with metadata:", {
      parentFileId,
      filePath,
      projectId,
      userId: session.session.user.id
    });
    
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        description: `Annotated version of ${parentFile?.name || 'image'}`,
        file_path: filePath,
        type: 'image',
        project_id: projectId,
        user_id: session.session.user.id,
        position: position,
        size: file.size,
        metadata: {
          annotated: true,
          parent_file_id: parentFileId
        }
      })
      .select()
      .single();
      
    if (fileError) {
      console.error('File insert error:', fileError);
      throw fileError;
    }
    
    console.log('Successfully saved annotated image:', {
      newFileId: fileData.id,
      parentFileId: parentFileId
    });
    return fileData.id;
  } catch (error) {
    console.error('Error saving annotated image:', error);
    toast.error('Failed to save annotated image');
    throw error;
  }
};
