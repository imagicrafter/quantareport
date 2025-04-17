
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
    // 1. Get user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('No active session found');
    }
    
    // 2. Upload file to storage
    const fileName = `annotated_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pub_images')
      .upload(`${projectId}/${fileName}`, file);
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // 3. Get public URL
    const { data: urlData } = await supabase.storage
      .from('pub_images')
      .getPublicUrl(`${projectId}/${fileName}`);
      
    const filePath = urlData.publicUrl;
    
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
    
    // 5. Get parent file information
    const { data: parentFile, error: parentError } = await supabase
      .from('files')
      .select('name, type')
      .eq('id', parentFileId)
      .single();
      
    if (parentError) {
      console.error('Error fetching parent file:', parentError);
    }
    
    // 6. Insert new file record with parent_file_id
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
    
    console.log('Successfully saved annotated image with parent ID:', parentFileId);
    return fileData.id;
  } catch (error) {
    console.error('Error saving annotated image:', error);
    toast.error('Failed to save annotated image');
    throw error;
  }
};
