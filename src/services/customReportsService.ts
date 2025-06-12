
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomReport {
  id: string;
  token: string;
  file_path: string;
  original_filename: string;
  title?: string;
  description?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  access_count: number;
  last_accessed_at?: string;
}

export interface CreateCustomReportData {
  token: string;
  file_path: string;
  original_filename: string;
  title?: string;
  description?: string;
}

/**
 * Generate a unique token for a custom report
 */
export const generateReportToken = (): string => {
  return crypto.randomUUID().replace(/-/g, '');
};

/**
 * Upload HTML file to storage and create custom report record
 */
export const uploadCustomReport = async (
  file: File,
  title?: string,
  description?: string
): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    const token = generateReportToken();
    const filename = `${token}.html`;
    const filePath = `custom-reports/${filename}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('pub_documents')
      .upload(filePath, file, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Create database record
    const { error: dbError } = await supabase
      .from('custom_reports')
      .insert([{
        token,
        file_path: filePath,
        original_filename: file.name,
        title: title || file.name,
        description,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      }]);

    if (dbError) {
      console.error('Error creating custom report record:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('pub_documents').remove([filePath]);
      return { success: false, error: 'Failed to create report record' };
    }

    toast.success('Custom report uploaded successfully');
    return { success: true, token };
  } catch (error) {
    console.error('Error uploading custom report:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get all custom reports (admin only)
 */
export const getCustomReports = async (): Promise<CustomReport[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom reports:', error);
      toast.error('Failed to load custom reports');
      return [];
    }

    return data as CustomReport[];
  } catch (error) {
    console.error('Error fetching custom reports:', error);
    toast.error('Failed to load custom reports');
    return [];
  }
};

/**
 * Get a custom report by token (public access)
 */
export const getCustomReportByToken = async (token: string): Promise<CustomReport | null> => {
  try {
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching custom report:', error);
      return null;
    }

    // Update access count and last accessed time
    await supabase
      .from('custom_reports')
      .update({
        access_count: data.access_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', data.id);

    return data as CustomReport;
  } catch (error) {
    console.error('Error fetching custom report:', error);
    return null;
  }
};

/**
 * Download HTML content from storage
 */
export const downloadCustomReportContent = async (filePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('pub_documents')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    return await data.text();
  } catch (error) {
    console.error('Error downloading custom report content:', error);
    return null;
  }
};

/**
 * Update custom report (admin only)
 */
export const updateCustomReport = async (
  id: string, 
  updates: Partial<CustomReport>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('custom_reports')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating custom report:', error);
      toast.error('Failed to update custom report');
      return false;
    }

    toast.success('Custom report updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating custom report:', error);
    toast.error('Failed to update custom report');
    return false;
  }
};

/**
 * Delete custom report (admin only)
 */
export const deleteCustomReport = async (id: string, filePath: string): Promise<boolean> => {
  try {
    // Delete from database first
    const { error: dbError } = await supabase
      .from('custom_reports')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting custom report from database:', dbError);
      toast.error('Failed to delete custom report');
      return false;
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('pub_documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Don't fail the operation if file deletion fails
    }

    toast.success('Custom report deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting custom report:', error);
    toast.error('Failed to delete custom report');
    return false;
  }
};
