
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type ReportStatus = 'draft' | 'published' | 'archived' | 'processing' | 'completed';

export interface Report {
  id: string;
  title: string;
  content: string;
  project_id: string;
  user_id: string;
  created_at: string;
  last_edited_at: string;
  status: ReportStatus;
  doc_url?: string;
  image_urls?: string[];
  template_id?: string;
}

/**
 * Fetches all reports for the current user
 */
export const fetchReports = async (): Promise<Report[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Convert the database response to our Report type
    return data.map(item => ({
      ...item,
      status: item.status as ReportStatus,
      image_urls: item.image_urls ? (item.image_urls as any) : []
    }));
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

/**
 * Fetches a single report by ID
 */
export const fetchReportById = async (id: string): Promise<Report> => {
  try {
    console.log(`Fetching report with ID ${id} from Supabase...`);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error in fetchReportById for ID ${id}:`, error);
      throw error;
    }

    if (!data) {
      console.error(`No report found with ID ${id}`);
      throw new Error(`Report with ID ${id} not found`);
    }

    console.log(`Report data retrieved:`, data);
    
    return {
      ...data,
      status: data.status as ReportStatus,
      image_urls: data.image_urls ? (data.image_urls as any) : []
    };
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

/**
 * Creates a new report
 */
export const createReport = async (report: Partial<Report>): Promise<Report> => {
  try {
    const now = new Date().toISOString();
    
    const newReport = {
      user_id: report.user_id,
      title: report.title || 'Untitled Report',
      content: report.content || '',
      project_id: report.project_id || '',
      status: report.status || 'draft',
      doc_url: report.doc_url || '',
      image_urls: report.image_urls || [],
      created_at: now,
      last_edited_at: now,
      template_id: report.template_id || null,
    };

    console.log('Creating new report with data:', newReport);
    const { data, error } = await supabase
      .from('reports')
      .insert(newReport)
      .select()
      .single();

    if (error) {
      console.error('Error in createReport:', error);
      throw error;
    }

    console.log('Report created successfully:', data);
    return {
      ...data,
      status: data.status as ReportStatus,
      image_urls: data.image_urls ? (data.image_urls as any) : []
    };
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

/**
 * Updates an existing report
 */
export const updateReport = async (id: string, updates: Partial<Report>): Promise<Report> => {
  try {
    console.log(`Updating report ${id} with:`, updates);
    
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        last_edited_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error in updateReport:', error);
      throw error;
    }

    console.log('Report updated successfully:', data);
    return {
      ...data,
      status: data.status as ReportStatus,
      image_urls: data.image_urls ? (data.image_urls as any) : []
    };
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

/**
 * Deletes a report
 */
export const deleteReport = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

/**
 * Exports the report to a Word document
 */
export const exportToWord = async (report: Report): Promise<void> => {
  try {
    // This is a placeholder for the actual export functionality
    // In a real implementation, this would convert the report to a Word document
    console.log('Exporting to Word:', report.title);
    
    // Create a simple HTML version of the content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
        </head>
        <body>
          ${report.content}
        </body>
      </html>
    `;
    
    // Create a Blob containing the HTML content
    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw error;
  }
};

/**
 * Exports the report to Google Docs
 */
export const exportToGoogleDocs = async (report: Report): Promise<void> => {
  try {
    // This is a placeholder for the actual Google Docs export functionality
    // In a real implementation, this would interact with the Google Docs API
    console.log('Exporting to Google Docs:', report.title);
    
    // For now, we'll just show a notification that this feature is not implemented
    alert('Export to Google Docs is not yet implemented. This would require Google Drive API integration.');
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);
    throw error;
  }
};
