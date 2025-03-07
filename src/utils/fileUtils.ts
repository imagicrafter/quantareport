
import { supabase } from '@/integrations/supabase/client';

export interface File {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  type: string;
  created_at: string;
  position: number;
}

/**
 * Updates the position of a file in the database
 */
export const updateFilePosition = async (fileId: string, newPosition: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('files')
      .update({ position: newPosition })
      .eq('id', fileId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating file position:', error);
    return false;
  }
};

/**
 * Reorders files after a drag and drop operation
 * @param files The current list of files
 * @param sourceIndex The original index of the dragged file
 * @param destinationIndex The target index where the file was dropped
 * @returns A promise that resolves to the reordered files array
 */
export const reorderFiles = async (
  files: File[],
  sourceIndex: number,
  destinationIndex: number
): Promise<File[]> => {
  if (sourceIndex === destinationIndex) return files;

  const reorderedFiles = Array.from(files);
  const [movedFile] = reorderedFiles.splice(sourceIndex, 1);
  reorderedFiles.splice(destinationIndex, 0, movedFile);

  // Update positions based on new order
  const updatedFiles = reorderedFiles.map((file, index) => ({
    ...file,
    position: index + 1
  }));

  // Update positions in the database
  const updatePromises = updatedFiles.map(file => 
    updateFilePosition(file.id, file.position)
  );
  
  await Promise.all(updatePromises);
  
  return updatedFiles;
};
