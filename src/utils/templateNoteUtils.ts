
import { supabase } from '@/integrations/supabase/client';

export interface TemplateNote {
  id: string;
  template_id: string;
  title: string;
  name: string;
  custom_content: string | null;
}

/**
 * Loads template notes for a given template
 */
export const loadTemplateNotes = async (templateId: string): Promise<TemplateNote[]> => {
  try {
    const { data, error } = await supabase
      .from('template_notes')
      .select(`
        id,
        template_id,
        title,
        name,
        custom_content
      `)
      .eq('template_id', templateId);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error loading template notes:', error);
    throw error;
  }
};

/**
 * Adds a new note to a template
 */
export const addNoteToTemplate = async (
  templateId: string, 
  title: string, 
  name: string
): Promise<TemplateNote> => {
  try {
    const { data, error } = await supabase
      .from('template_notes')
      .insert({
        template_id: templateId,
        title: title.trim(),
        name: name.trim(),
        custom_content: ""
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error adding note to template:", error);
    throw error;
  }
};

/**
 * Updates an existing template note
 */
export const updateTemplateNote = async (
  noteId: string, 
  updates: { title?: string; name?: string; custom_content?: string }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('template_notes')
      .update(updates)
      .eq('id', noteId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating template note:", error);
    throw error;
  }
};

/**
 * Removes a note from a template
 */
export const removeNoteFromTemplate = async (noteId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('template_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing note from template:", error);
    throw error;
  }
};
