
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProjectFile } from '@/components/dashboard/files/FileItem';

export interface NoteFileRelationship {
  id: string;
  note_id: string;
  file_id: string;
  created_at: string;
  file?: ProjectFile;
}

/**
 * Fetches all files related to a specific note
 */
export const fetchRelatedFiles = async (noteId: string): Promise<NoteFileRelationship[]> => {
  try {
    const { data: relationships, error } = await supabase
      .from('note_file_relationships')
      .select(`
        id,
        note_id,
        file_id,
        created_at,
        files:file_id (
          id,
          name,
          description,
          file_path,
          type,
          created_at,
          position
        )
      `)
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform the data to include the file details
    return relationships.map(item => ({
      id: item.id,
      note_id: item.note_id,
      file_id: item.file_id,
      created_at: item.created_at,
      file: item.files as ProjectFile
    }));
  } catch (error) {
    console.error('Error fetching related files:', error);
    toast.error('Failed to load related files');
    return [];
  }
};

/**
 * Fetches all files for a project that are not already related to the note
 */
export const fetchAvailableFiles = async (projectId: string, noteId: string): Promise<ProjectFile[]> => {
  try {
    // Get already related file IDs
    const { data: relationships, error: relError } = await supabase
      .from('note_file_relationships')
      .select('file_id')
      .eq('note_id', noteId);

    if (relError) throw relError;

    // Extract file IDs that are already related
    const relatedFileIds = relationships.map(rel => rel.file_id);
    
    // Get project files that are not already related
    let query = supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });
    
    // If there are related files, filter them out
    if (relatedFileIds.length > 0) {
      query = query.not('id', 'in', `(${relatedFileIds.join(',')})`);
    }
    
    const { data: files, error } = await query;

    if (error) throw error;

    return files as ProjectFile[];
  } catch (error) {
    console.error('Error fetching available files:', error);
    toast.error('Failed to load available files');
    return [];
  }
};

/**
 * Creates a relationship between a note and a file
 */
export const addFileToNote = async (noteId: string, fileId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('note_file_relationships')
      .insert({
        note_id: noteId,
        file_id: fileId
      });

    if (error) throw error;
    
    toast.success('File added to note');
    return true;
  } catch (error) {
    console.error('Error adding file to note:', error);
    toast.error('Failed to add file to note');
    return false;
  }
};

/**
 * Removes a relationship between a note and a file
 */
export const removeFileFromNote = async (relationshipId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('note_file_relationships')
      .delete()
      .eq('id', relationshipId);

    if (error) throw error;
    
    toast.success('File removed from note');
    return true;
  } catch (error) {
    console.error('Error removing file from note:', error);
    toast.error('Failed to remove file from note');
    return false;
  }
};
