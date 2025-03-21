import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  title: string;
  name: string;
  content: string;
  created_at: string;
  position: number;
}

/**
 * Updates the position of a note in the database
 */
export const updateNotePosition = async (noteId: string, newPosition: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ position: newPosition })
      .eq('id', noteId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating note position:', error);
    return false;
  }
};

/**
 * Reorders notes after a drag and drop operation
 * @param notes The current list of notes
 * @param sourceIndex The original index of the dragged note
 * @param destinationIndex The target index where the note was dropped
 * @returns A promise that resolves to the reordered notes array
 */
export const reorderNotes = async (
  notes: Note[],
  sourceIndex: number,
  destinationIndex: number
): Promise<Note[]> => {
  if (sourceIndex === destinationIndex) return notes;

  const reorderedNotes = Array.from(notes);
  const [movedNote] = reorderedNotes.splice(sourceIndex, 1);
  reorderedNotes.splice(destinationIndex, 0, movedNote);

  // Update positions based on new order
  const updatedNotes = reorderedNotes.map((note, index) => ({
    ...note,
    position: index + 1
  }));

  // Update positions in the database
  const updatePromises = updatedNotes.map(note => 
    updateNotePosition(note.id, note.position)
  );
  
  await Promise.all(updatePromises);
  
  return updatedNotes;
};

/**
 * Converts a title to camelCase for use as a note name
 * @param title The title to convert
 * @returns The title converted to camelCase
 */
export const titleToCamelCase = (title: string): string => {
  // Remove any non-alphanumeric characters and split by spaces
  const words = title.replace(/[^\w\s]/g, '').split(/\s+/);
  
  if (words.length === 0) return '';
  
  // First word lowercase
  let result = words[0].toLowerCase();
  
  // Rest of the words with first letter capitalized
  for (let i = 1; i < words.length; i++) {
    if (words[i]) {
      result += words[i][0].toUpperCase() + words[i].substring(1).toLowerCase();
    }
  }
  
  return result;
};
