
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { fetchReportById, updateReport, createReport } from '../ReportService';
import { getWebhookUrl, getCurrentEnvironment, isDevelopmentEnvironment } from '@/utils/webhookConfig';

/**
 * Initializes a report progress record in the database
 */
export const initializeReportProgress = async (reportId: string, jobUuid: string) => {
  try {
    const { error: progressError } = await supabase
      .from('report_progress')
      .insert({
        report_id: reportId,
        status: 'generating',
        message: 'Starting report generation...',
        progress: 5,
        job: jobUuid
      });
      
    if (progressError) {
      console.error('Error creating initial progress record:', progressError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing report progress:', error);
    return false;
  }
};

/**
 * Creates initial report content with project name and date
 */
export const createInitialReportContent = (projectName: string) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1 style="text-align: center; color: #2563eb; margin-bottom: 20px;">${projectName} - Project Report</h1>
      <p style="text-align: center; font-style: italic; margin-bottom: 30px;">Generated on ${currentDate}</p>
      <p>This is an automatically generated report for the ${projectName} project.</p>
    </div>
  `;
};

/**
 * Creates the report and returns the created report object
 */
export const createInitialReport = async (
  projectId: string, 
  userId: string, 
  projectName: string, 
  imageUrls: string[],
  templateId: string | null,
  isTestMode = false
) => {
  try {
    const initialContent = createInitialReportContent(projectName);
    
    const reportTitle = isTestMode 
      ? `##TESTING## ${projectName} Report` 
      : `${projectName} Report`;
    
    const reportData = {
      title: reportTitle,
      content: initialContent,
      project_id: projectId,
      user_id: userId,
      status: 'processing' as const,
      image_urls: imageUrls,
      template_id: templateId
    };
    
    console.log('Creating report with data:', reportData);
    const newReport = await createReport(reportData);
    console.log('Report created:', newReport);
    
    return newReport;
  } catch (error) {
    console.error('Error creating initial report:', error);
    throw error;
  }
};

/**
 * Sends a webhook to trigger report generation
 */
export const triggerReportGeneration = async (
  reportId: string,
  projectId: string,
  userId: string,
  projectName: string,
  imageUrls: string[],
  templateId: string | null,
  jobUuid: string,
  isTestMode = false
) => {
  try {
    const environment = getCurrentEnvironment();
    console.log(`Current app environment: ${environment}, Test mode: ${isTestMode}`);
    
    const reportWebhookUrl = getWebhookUrl('report', environment, isTestMode);
    
    console.log(`Using webhook URL: ${reportWebhookUrl} (Test mode: ${isTestMode}, Environment: ${environment})`);
    
    const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL || "https://vtaufnxworztolfdwlll.supabase.co";
    const callbackUrl = `${supabaseProjectUrl}/functions/v1/report-progress/${reportId}`;
    
    console.log(`Using Supabase edge function callback URL: ${callbackUrl}`);
    
    const webhookPayload = {
      project_id: projectId,
      report_id: reportId,
      user_id: userId,
      project_name: projectName,
      timestamp: new Date().toISOString(),
      image_count: imageUrls.length,
      image_urls: imageUrls,
      template_id: templateId,
      action: 'generate_report',
      callback_url: callbackUrl,
      job: jobUuid,
      is_test: isTestMode
    };
    
    console.log('Webhook payload:', webhookPayload);
    
    try {
      console.log(`Sending webhook to: ${reportWebhookUrl}`);
      
      const postResponse = await fetch(reportWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify(webhookPayload)
      });
      
      if (postResponse.ok) {
        console.log(`Webhook POST request to ${reportWebhookUrl} succeeded:`, await postResponse.text());
        return true;
      } else {
        console.error(`Webhook POST response error for ${reportWebhookUrl}:`, await postResponse.text());
        
        // Fall back to GET request if POST fails
        const getUrl = new URL(reportWebhookUrl);
        Object.entries(webhookPayload).forEach(([key, value]) => {
          getUrl.searchParams.append(key, String(value));
        });
        
        const getResponse = await fetch(getUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          mode: 'cors'
        });
        
        if (getResponse.ok) {
          console.log(`Webhook GET request to ${reportWebhookUrl} succeeded:`, await getResponse.text());
          return true;
        } else {
          console.error(`Webhook GET response error for ${reportWebhookUrl}:`, await getResponse.text());
          throw new Error(`Failed to send webhook request to ${reportWebhookUrl}`);
        }
      }
    } catch (error) {
      console.error(`Error sending webhook to ${reportWebhookUrl}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error triggering report generation:', error);
    throw error;
  }
};

/**
 * Main function to generate a report
 */
export const generateReport = async (
  projectId: string,
  userId: string,
  setCreatingReport?: (id: string | null) => void,
  setReportCreated?: (data: {id: string, content: string} | null) => void,
  setGenerationInProgress?: React.Dispatch<React.SetStateAction<{[key: string]: boolean}>>
) => {
  try {
    if (setCreatingReport) {
      setCreatingReport(projectId);
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) throw projectError;
    
    const { data: images, error: imagesError } = await supabase
      .from('files')
      .select('file_path')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('type', 'image');
      
    if (imagesError) throw imagesError;
    
    const imageUrls = images ? images.map(img => img.file_path) : [];
    
    const isTestReport = project.name.toLowerCase().includes('test');
    const shouldUseTestMode = isDevelopmentEnvironment() && isTestReport;
    
    // Generate a unique job ID
    const jobUuid = uuidv4();
    console.log(`Generated job UUID: ${jobUuid}`);
    
    // Create the initial report
    const newReport = await createInitialReport(
      projectId,
      userId,
      project.name,
      imageUrls,
      project.template_id,
      shouldUseTestMode
    );
    
    // Initialize the progress record
    await initializeReportProgress(newReport.id, jobUuid);
    
    if (setReportCreated) {
      setReportCreated({
        id: newReport.id,
        content: newReport.content
      });
    }
    
    toast.success('Report created. Generating content...');
    
    // Trigger the report generation process
    await triggerReportGeneration(
      newReport.id,
      projectId,
      userId,
      project.name,
      imageUrls,
      project.template_id,
      jobUuid,
      shouldUseTestMode
    );
    
    return {
      success: true,
      reportId: newReport.id,
      reportContent: newReport.content
    };
  } catch (error) {
    console.error('Error generating report:', error);
    toast.error('Failed to generate report. Please try again.');
    
    if (setCreatingReport) {
      setCreatingReport(null);
    }
    
    if (setGenerationInProgress) {
      setGenerationInProgress(prev => {
        const updated = {...prev};
        delete updated[projectId];
        return updated;
      });
    }
    
    return {
      success: false,
      error
    };
  }
};

/**
 * Sets up real-time subscription to report progress updates
 */
export const setupReportProgressSubscription = (
  reportId: string,
  onUpdate: (update: any) => void,
  onComplete: () => void
) => {
  const channelName = `report-progress-${reportId}-${Date.now()}`;
  console.log(`Creating channel with name: ${channelName}`);
  
  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'report_progress',
        filter: `report_id=eq.${reportId}`
      },
      (payload) => {
        const update = payload.new;
        console.log('Received progress update:', update);
        onUpdate(update);
        
        if (update.status === 'completed' || update.progress >= 100) {
          console.log('Report completed');
          onComplete();
        }
      }
    )
    .subscribe((status) => {
      console.log(`Channel ${channelName} subscription status:`, status);
    });
    
  // Return a cleanup function
  return () => {
    console.log('Removing channel:', subscription.topic);
    supabase.removeChannel(subscription);
  };
};

/**
 * Checks initial report status and setup monitoring
 */
export const checkInitialReportStatus = async (
  reportId: string,
  onUpdate: (update: any) => void,
  onComplete: () => void
) => {
  try {
    console.log(`Checking initial status for report ${reportId}`);
    
    const { data: initialStatus, error: initialStatusError } = await supabase
      .from('report_progress')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!initialStatusError && initialStatus && initialStatus.length > 0) {
      console.log('Initial status found:', initialStatus[0]);
      const update = initialStatus[0];
      onUpdate(update);
      
      if (update.status === 'completed' || update.progress >= 100) {
        console.log('Report already completed');
        onComplete();
        return true;
      }
    }
    
    return false;
  } catch (err) {
    console.error('Error checking initial status:', err);
    return false;
  }
};

/**
 * Navigates to the report editor once report is completed
 */
export const navigateToReportEditor = async (reportId: string, navigate: Function, onClose?: () => void) => {
  try {
    console.log(`Report ${reportId} completed, navigating to editor...`);
    const report = await fetchReportById(reportId);
    
    if (report.status === 'processing') {
      // Update report status to draft
      await updateReport(report.id, { status: 'draft' });
      
      // Also update the project workflow state to 6
      console.log(`Updating project workflow state to 6 for project ${report.project_id}`);
      
      // Get current user
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session found when updating workflow state');
      } else {
        const userId = session.session.user.id;
        
        // Check if workflow record exists
        const { data: existingWorkflow } = await supabase
          .from('project_workflow')
          .select('id')
          .eq('project_id', report.project_id)
          .maybeSingle();
          
        if (existingWorkflow) {
          // Update existing workflow state
          const { error: updateError } = await supabase
            .from('project_workflow')
            .update({ workflow_state: 6, last_edited_at: new Date().toISOString() })
            .eq('project_id', report.project_id);
            
          if (updateError) {
            console.error('Error updating workflow state:', updateError);
          } else {
            console.log(`Successfully updated workflow state to 6 for project ${report.project_id}`);
          }
        } else if (userId) {
          // Create new workflow record if it doesn't exist
          const { error: insertError } = await supabase
            .from('project_workflow')
            .insert({
              project_id: report.project_id,
              user_id: userId,
              workflow_state: 6,
              last_edited_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating workflow state:', insertError);
          } else {
            console.log(`Successfully created workflow state 6 for project ${report.project_id}`);
          }
        }
      }
    }
    
    if (onClose) {
      onClose();
    }
    
    navigate(`/dashboard/reports/editor/${report.id}`);
    return true;
  } catch (error) {
    console.error('Error navigating to report:', error);
    toast.error('Something went wrong. Please try again.');
    return false;
  }
};

/**
 * Checks if report content has been updated
 */
export const checkReportContent = async (
  reportId: string, 
  currentContent: string,
  onContentUpdated: () => void
) => {
  if (!reportId) return false;
  
  try {
    console.log(`Checking if report ${reportId} content has been updated...`);
    const report = await fetchReportById(reportId);
    
    if (report.content && report.content !== currentContent) {
      console.log('Report content has been updated');
      onContentUpdated();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking report content:', error);
    return false;
  }
};

