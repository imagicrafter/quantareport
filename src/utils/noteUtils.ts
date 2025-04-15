import { NoteFileRelationship } from './noteFileRelationshipUtils';
import { supabase } from '@/integrations/supabase/client';
import { getWebhookUrl, isDevelopmentEnvironment } from './webhookConfig';

export interface NoteFileRelationshipWithType extends NoteFileRelationship {
  file_type: string;
  file_path: string;
}

// Define Note interface to fix missing export error
export interface Note {
  id: string;
  name: string;
  title: string;
  content: string | null;
  analysis: string | null;
  created_at: string | null;
  user_id: string;
  project_id: string;
  position: number | null;
  files_relationships_is_locked?: boolean;
  metadata?: any | null; // Using 'any' to accommodate both string and object formats
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
    
    // Update positions in database - fix the upsert call
    // We need to only update the position field, but include all required fields for the update
    const updates = updatedNotes.map(note => ({
      id: note.id,
      position: note.position,
      // Include these required fields from the existing note
      name: note.name,
      title: note.title,
      project_id: note.project_id,
      user_id: note.user_id
    }));
    
    const { error } = await supabase
      .from('notes')
      .upsert(updates);
    
    if (error) throw error;
    
    return updatedNotes;
  } catch (error) {
    console.error('Error reordering notes:', error);
    throw error;
  }
};

// Function to submit image analysis request
export const submitImageAnalysis = async (
  noteId: string, 
  projectId: string, 
  imageUrls: string[], 
  isTestMode: boolean
): Promise<boolean> => {
  try {
    // Only consider isTestMode when in development environment
    const shouldUseTestMode = isDevelopmentEnvironment() && isTestMode;
    console.log(`Using ${shouldUseTestMode ? 'TEST' : 'REGULAR'} mode for project (App Environment: ${isDevelopmentEnvironment() ? 'Development' : 'Production/Staging'})`);
    
    const payload = {
      note_id: noteId,
      project_id: projectId,
      image_urls: imageUrls,
      timestamp: new Date().toISOString()
    };
    
    // Use the consolidated n8n-webhook-proxy function directly
    const { error } = await supabase.functions.invoke('n8n-webhook-proxy/proxy', {
      body: {
        env: shouldUseTestMode ? 'development' : isDevelopmentEnvironment() ? 'development' : 'production',
        payload,
        type: 'note',
        isTestMode: shouldUseTestMode
      }
    });
    
    if (error) {
      console.error('Error invoking n8n-webhook-proxy function:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting image analysis:', error);
    return false;
  }
};

// Helper to parse metadata safely
export const parseNoteMetadata = (note: any): Note => {
  try {
    if (note.metadata && typeof note.metadata === 'string') {
      const parsedMetadata = JSON.parse(note.metadata);
      console.log('Parsed note metadata:', note.id, parsedMetadata);
      return {
        ...note,
        metadata: parsedMetadata
      };
    }
  } catch (e) {
    console.error('Error parsing note metadata:', e, note.metadata);
  }
  return note;
};
