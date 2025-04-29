import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '@/components/dashboard/files/FileItem';

export const reorderFiles = async (
  files: ProjectFile[],
  sourceIndex: number,
  destinationIndex: number
): Promise<ProjectFile[]> => {
  // Create a new array to avoid mutating the original
  const reorderedFiles = [...files];
  // Remove the dragged item from the array
  const [removedFile] = reorderedFiles.splice(sourceIndex, 1);
  // Insert the dragged item at its new position
  reorderedFiles.splice(destinationIndex, 0, removedFile);
  
  // Update positions in the reordered array
  const updatedFiles = reorderedFiles.map((file, index) => ({
    ...file,
    position: index + 1
  }));
  
  // Update the positions in the database
  for (const file of updatedFiles) {
    try {
      await supabase
        .from('files')
        .update({ position: file.position })
        .eq('id', file.id);
    } catch (error) {
      console.error('Error updating file position:', error);
      throw error;
    }
  }
  
  return updatedFiles;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const removeImageExtension = (filename: string): string => {
  // Only remove extension for image files
  if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
    return filename.replace(/\.[^/.]+$/, '');
  }
  return filename;
};
