
import { NoteFileRelationship } from './noteFileRelationshipUtils';
import { supabase } from '@/integrations/supabase/client';

// Get n8n webhook URLs from environment variables with fallbacks
export const NOTE_DEV_WEBHOOK_URL = import.meta.env.VITE_N8N_NOTE_DEV_WEBHOOK || 'https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843';
export const NOTE_PROD_WEBHOOK_URL = import.meta.env.VITE_N8N_NOTE_PROD_WEBHOOK || 'https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843';

export interface NoteFileRelationshipWithType extends NoteFileRelationship {
  file_type: string;
  file_path: string;
}

// Define Note interface to fix missing export error
export interface Note {
  id: string;
  title: string;
  content: string | null;
  name: string;
  position: number;
  created_at: string;
  project_id: string;
  user_id: string;
}

// Title to camelCase conversion utility function
export const titleToCamelCase = (title: string): string => {
  // Convert spaces to camelCase and remove special characters
  return title
    .trim()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};

// Function to reorder notes
export const reorderNotes = async (notes: Note[], sourceIndex: number, destinationIndex: number): Promise<Note[]> => {
  try {
    const reorderedNotes = [...notes];
    const [removed] = reorderedNotes.splice(sourceIndex, 1);
    reorderedNotes.splice(destinationIndex, 0, removed);
    
    // Update position values
    const updatedNotes = reorderedNotes.map((note, index) => ({
      ...note,
      position: index + 1
    }));
    
    // Update positions in database
    const updates = updatedNotes.map(note => ({
      id: note.id,
      position: note.position
    }));
    
    const { error } = await supabase
      .from('notes')
      .upsert(updates, { onConflict: 'id' });
    
    if (error) throw error;
    
    return updatedNotes;
  } catch (error) {
    console.error('Error reordering notes:', error);
    throw error;
  }
};
