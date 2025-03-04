
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Report {
  id: string;
  title: string;
  content: string;
  project_id: string;
  user_id: string;
  created_at: string;
  last_edited_at?: string;
  status: 'draft' | 'published' | 'archived';
  doc_url?: string;
  image_urls?: string[];
}

export const fetchReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('last_edited_at', { ascending: false })
    .limit(10);

  if (error) {
    toast.error('Failed to fetch reports');
    throw error;
  }

  return data || [];
};

export const fetchReportById = async (id: string): Promise<Report | null> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    toast.error('Failed to fetch report');
    throw error;
  }

  return data;
};

export const createReport = async (report: Partial<Report>): Promise<Report> => {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    toast.error('You must be logged in to create a report');
    throw new Error('No active session');
  }

  const userId = session.session.user.id;
  
  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...report,
      user_id: userId,
      status: report.status || 'draft',
      created_at: new Date().toISOString(),
      last_edited_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    toast.error('Failed to create report');
    throw error;
  }

  toast.success('Report created successfully');
  return data;
};

export const updateReport = async (id: string, updates: Partial<Report>): Promise<Report> => {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Failed to update report');
    throw error;
  }

  toast.success('Report saved successfully');
  return data;
};

export const deleteReport = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Failed to delete report');
    throw error;
  }

  toast.success('Report deleted successfully');
};

export const exportToWord = (report: Report): void => {
  // Placeholder for Word export functionality
  // In a real implementation, this would use a library like html-to-docx
  toast.info('Export to Word functionality will be implemented');
  console.log('Exporting to Word:', report);
};

export const exportToGoogleDocs = (report: Report): void => {
  // Placeholder for Google Docs export functionality
  toast.info('Export to Google Docs functionality will be implemented');
  console.log('Exporting to Google Docs:', report);
};
