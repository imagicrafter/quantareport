
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface PublishedReport {
  id: string;
  token: string;
  report_id: string;
  file_path: string;
  original_title: string;
  title?: string;
  description?: string;
  published_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  access_count: number;
  last_accessed_at?: string;
  pre_authorized_url?: string;
  url_expires_at?: string;
}

export const publishReport = async (
  reportId: string,
  reportTitle: string,
  reportContent: string
): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, error: 'Authentication required' };
    }

    // Generate unique token
    const token = uuidv4();
    const fileName = `${token}.html`;
    
    // Upload HTML content to storage bucket
    const { error: uploadError } = await supabase.storage
      .from('published-reports')
      .upload(fileName, new Blob([reportContent], { type: 'text/html' }), {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: 'Failed to upload report content' };
    }

    // Create record in published_reports table
    const { error: dbError } = await supabase
      .from('published_reports')
      .insert({
        token,
        report_id: reportId,
        file_path: fileName,
        original_title: reportTitle,
        title: reportTitle,
        published_by: session.session.user.id
      });

    if (dbError) {
      console.error('Error creating published report record:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('published-reports').remove([fileName]);
      return { success: false, error: 'Failed to create published report record' };
    }

    // Update report status to published
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'published' })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating report status:', updateError);
    }

    return { success: true, token };
  } catch (error) {
    console.error('Error publishing report:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const unpublishReport = async (reportId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, error: 'Authentication required' };
    }

    // Get published report details
    const { data: publishedReport, error: fetchError } = await supabase
      .from('published_reports')
      .select('file_path')
      .eq('report_id', reportId)
      .single();

    if (fetchError || !publishedReport) {
      return { success: false, error: 'Published report not found' };
    }

    // Delete from storage
    const { error: deleteFileError } = await supabase.storage
      .from('published-reports')
      .remove([publishedReport.file_path]);

    if (deleteFileError) {
      console.error('Error deleting file from storage:', deleteFileError);
    }

    // Delete from published_reports table
    const { error: deleteDbError } = await supabase
      .from('published_reports')
      .delete()
      .eq('report_id', reportId);

    if (deleteDbError) {
      console.error('Error deleting published report record:', deleteDbError);
      return { success: false, error: 'Failed to unpublish report' };
    }

    // Update report status back to draft
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'draft' })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating report status:', updateError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error unpublishing report:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const getPublishedReportByToken = async (token: string): Promise<{ report?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('published_reports')
      .select(`
        *,
        reports(title, content)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { error: 'Published report not found' };
    }

    // Increment access count
    await supabase
      .from('published_reports')
      .update({ 
        access_count: data.access_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('token', token);

    return { report: data };
  } catch (error) {
    console.error('Error fetching published report:', error);
    return { error: 'An unexpected error occurred' };
  }
};

export const fetchPublishedReports = async (): Promise<PublishedReport[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return [];
    }

    const { data, error } = await supabase
      .from('published_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching published reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching published reports:', error);
    return [];
  }
};
