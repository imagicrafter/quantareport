
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GOOGLE_API_SCOPE = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file';
const REDIRECT_URI = `${window.location.origin}/dashboard/reports`;

// Store the report ID in localStorage before redirecting for OAuth
export const storeReportForExport = (reportId: string) => {
  if (typeof reportId !== 'string') {
    console.error('Invalid report ID passed to storeReportForExport:', reportId);
    return;
  }
  localStorage.setItem('pendingGoogleDocsExport', reportId);
};

// Check if there's a pending export after OAuth redirect
export const checkPendingExport = async () => {
  const pendingReportId = localStorage.getItem('pendingGoogleDocsExport');
  if (!pendingReportId) return;
  
  // Get the authorization code from the URL
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  
  if (code) {
    try {
      toast('Processing Google Docs export...');
      
      // Exchange the code for tokens through our edge function
      const { data, error } = await supabase.functions.invoke('google-docs-export', {
        body: { 
          code, 
          redirect_uri: REDIRECT_URI,
          report_id: pendingReportId 
        }
      });
      
      if (error) throw error;
      
      if (data?.documentUrl) {
        toast.success('Document exported to Google Docs successfully!');
        // Open the document in a new tab
        window.open(data.documentUrl, '_blank');
      } else {
        toast.error('Failed to create Google Doc');
      }
    } catch (err) {
      console.error('Error exporting to Google Docs:', err);
      toast.error('Failed to export to Google Docs');
    } finally {
      // Clear the pending export
      localStorage.removeItem('pendingGoogleDocsExport');
      // Clean up the URL to remove the code
      window.history.replaceState({}, document.title, REDIRECT_URI);
    }
  }
};

export const initiateGoogleDocsExport = async (reportId: string) => {
  try {
    // Ensure reportId is a string
    if (typeof reportId !== 'string') {
      console.error('Invalid report ID type:', typeof reportId, reportId);
      toast.error('Invalid report ID');
      return;
    }
    
    // Store the report ID for after OAuth redirect
    storeReportForExport(reportId);
    
    // Get the OAuth URL from our edge function
    const { data, error } = await supabase.functions.invoke('google-docs-auth-url', {
      body: { 
        redirect_uri: REDIRECT_URI 
      }
    });
    
    if (error) throw error;
    
    if (data?.url) {
      // Redirect the user to Google's OAuth page
      window.location.href = data.url;
    } else {
      throw new Error('Failed to get OAuth URL');
    }
  } catch (err) {
    console.error('Error initiating Google Docs export:', err);
    toast.error('Failed to initiate Google Docs export');
    localStorage.removeItem('pendingGoogleDocsExport');
  }
};
