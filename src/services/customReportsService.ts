
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
  pre_authorized_url?: string;
  url_expires_at?: string;
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
 * Generate a 30-day pre-authorized URL for a file
 */
const generatePreAuthorizedUrl = async (filePath: string): Promise<{ url: string; expiresAt: Date } | null> => {
  try {
    const expiresIn = 30 * 24 * 60 * 60; // 30 days in seconds
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase.storage
      .from('custom-reports')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return {
      url: data.signedUrl,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating pre-authorized URL:', error);
    return null;
  }
};

/**
 * Upload HTML file to private storage and create custom report record
 */
export const uploadCustomReport = async (
  file: File,
  title?: string,
  description?: string
): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    const token = generateReportToken();
    const filename = `${token}.html`;
    const filePath = filename; // No subfolder needed since bucket is dedicated

    // Upload file to private storage
    const { error: uploadError } = await supabase.storage
      .from('custom-reports')
      .upload(filePath, file, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Generate pre-authorized URL
    const urlData = await generatePreAuthorizedUrl(filePath);
    if (!urlData) {
      // Clean up uploaded file
      await supabase.storage.from('custom-reports').remove([filePath]);
      return { success: false, error: 'Failed to generate access URL' };
    }

    // Create database record with explicit type assertion
    const insertData = {
      token,
      file_path: filePath,
      original_filename: file.name,
      title: title || file.name,
      description,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      pre_authorized_url: urlData.url,
      url_expires_at: urlData.expiresAt.toISOString()
    } as any; // Type assertion to bypass TypeScript check for new columns

    const { error: dbError } = await supabase
      .from('custom_reports')
      .insert([insertData]);

    if (dbError) {
      console.error('Error creating custom report record:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('custom-reports').remove([filePath]);
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
 * Refresh pre-authorized URL if it's expired or about to expire
 */
const refreshPreAuthorizedUrl = async (report: CustomReport): Promise<string | null> => {
  try {
    // Check if URL expires within the next 7 days
    const expiresAt = new Date(report.url_expires_at || '');
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (expiresAt > sevenDaysFromNow && report.pre_authorized_url) {
      // URL is still valid for more than 7 days
      return report.pre_authorized_url;
    }

    // Generate new pre-authorized URL
    const urlData = await generatePreAuthorizedUrl(report.file_path);
    if (!urlData) {
      return null;
    }

    // Update database record with explicit type assertion
    const updateData = {
      pre_authorized_url: urlData.url,
      url_expires_at: urlData.expiresAt.toISOString()
    } as any; // Type assertion to bypass TypeScript check for new columns

    const { error } = await supabase
      .from('custom_reports')
      .update(updateData)
      .eq('id', report.id);

    if (error) {
      console.error('Error updating pre-authorized URL:', error);
      return null;
    }

    return urlData.url;
  } catch (error) {
    console.error('Error refreshing pre-authorized URL:', error);
    return null;
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
      } as any) // Type assertion for safe update
      .eq('id', data.id);

    return data as CustomReport;
  } catch (error) {
    console.error('Error fetching custom report:', error);
    return null;
  }
};

/**
 * Download HTML content using pre-authorized URL
 */
export const downloadCustomReportContent = async (report: CustomReport): Promise<string | null> => {
  try {
    // Refresh URL if needed
    const url = await refreshPreAuthorizedUrl(report);
    if (!url) {
      console.error('Failed to get valid pre-authorized URL');
      return null;
    }

    // Fetch content using the pre-authorized URL
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch report content:', response.statusText);
      return null;
    }

    return await response.text();
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
      .update(updates as any) // Type assertion for update operation
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
      .from('custom-reports')
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
