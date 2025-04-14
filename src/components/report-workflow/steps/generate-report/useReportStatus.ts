import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useReportGeneration } from '@/hooks/reports/useReportGeneration';

export const useReportStatus = (projectId: string | null) => {
  const { toast } = useToast();
  const [existingReport, setExistingReport] = useState<{ id: string, status: string, content?: string } | null>(null);
  const [isStaleReport, setIsStaleReport] = useState(false);
  
  const {
    creatingReport,
    generationInProgress,
    reportCreated,
    setReportCreated,
    progressUpdate,
    handleCreateReport,
    navigateToReport
  } = useReportGeneration();
  
  useEffect(() => {
    const fetchExistingReport = async () => {
      if (!projectId) return;
      
      try {
        // Check if a report already exists for this project
        const { data: existingReports, error: reportsError } = await supabase
          .from('reports')
          .select('id, content, status')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (reportsError) {
          console.error('Error checking for existing reports:', reportsError);
          return;
        }
        
        // If we have an existing report, set it to display its status
        if (existingReports && existingReports.length > 0) {
          console.log('Found existing report:', existingReports[0]);
          const latestReport = existingReports[0];
          
          // Set existing report
          setExistingReport(latestReport);
          
          // Check if report is in processing status
          if (latestReport.status === 'processing') {
            await checkReportProgressStatus(latestReport.id);
          }
        }
      } catch (error) {
        console.error('Error fetching existing report:', error);
      }
    };
    
    fetchExistingReport();
  }, [projectId]);
  
  const checkReportProgressStatus = async (reportId: string) => {
    try {
      // Get the latest progress update for this report
      const { data: progressData, error: progressError } = await supabase
        .from('report_progress')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (progressError) {
        console.error('Error fetching report progress:', progressError);
        return;
      }

      if (!progressData || progressData.length === 0) {
        console.log('No progress data found for report:', reportId);
        setIsStaleReport(true);
        return;
      }

      const latestProgress = progressData[0];
      console.log('Latest progress data:', latestProgress);

      // Check if the latest update is more than 15 minutes old
      const latestUpdateTime = new Date(latestProgress.created_at);
      const currentTime = new Date();
      const timeDifferenceMinutes = (currentTime.getTime() - latestUpdateTime.getTime()) / (1000 * 60);

      if (timeDifferenceMinutes > 15 && latestProgress.status !== 'completed') {
        console.log('Report progress is stale (over 15 minutes old)');
        setIsStaleReport(true);
        
        // Archive the stale report
        await supabase
          .from('reports')
          .update({ status: 'archived' })
          .eq('id', reportId);
        
        toast({
          title: "Stale Report Detected",
          description: "Previous report generation timed out. Starting a new report.",
        });
      } else {
        // Use the latest progress update
        if (latestProgress) {
          const progressUpdateData = {
            report_id: latestProgress.report_id,
            status: latestProgress.status as 'idle' | 'generating' | 'completed' | 'error',
            message: latestProgress.message,
            progress: latestProgress.progress,
            created_at: latestProgress.created_at,
            job: latestProgress.job
          };
          
          // Use the report generation hook to update progress
          if (setReportCreated) {
            setReportCreated({
              id: reportId,
              content: existingReport?.content || ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking report progress status:', error);
    }
  };
  
  // Functions for getting status
  const getStatus = (): 'idle' | 'generating' | 'completed' | 'error' => {
    if (progressUpdate) return progressUpdate.status;
    
    // If we have a valid existing report that's not stale or draft, show it as completed
    if (existingReport?.status === 'completed' || 
       (existingReport?.status !== 'draft' && 
        existingReport?.content && 
        !isStaleReport)) {
      return 'completed';
    }
    
    return 'idle';
  };
  
  const getMessage = (): string => {
    if (progressUpdate) return progressUpdate.message;
    if (isStaleReport) return 'Previous report timed out. Click Generate Report to start a new one.';
    if (existingReport?.status === 'completed') return 'Report generated successfully.';
    return 'Click the Generate Report button to start.';
  };
  
  const getProgress = (): number => {
    if (progressUpdate) return progressUpdate.progress;
    if (existingReport?.status === 'completed') return 100;
    return 0;
  };
  
  const handleGenerateReport = async () => {
    if (!projectId) return;
    
    // Prevent duplicate generations
    if (generationInProgress[projectId]) {
      toast({
        title: "Already in Progress",
        description: "Report generation is already in progress. Please wait.",
      });
      return;
    }
    
    // Check if we have a stale report that was marked for archiving
    if (isStaleReport && existingReport) {
      console.log('Using archived report, generating a new one');
      await handleCreateReport(projectId);
      return;
    }
    
    // Check if we already have a completed report
    if (existingReport?.status === 'processing') {
      // This report is already being processed
      // We've already checked if it's stale in the useEffect
      toast({
        title: "Report Processing",
        description: "A report is already being processed. Please wait for it to complete.",
      });
      return;
    }
    
    // If we have a completed report, ask if they want to regenerate
    if (existingReport?.status !== 'draft' && existingReport?.content) {
      toast({
        title: "Using Existing Report",
        description: "Your report has already been generated. Proceeding to review.",
      });
      
      // Go to the next step with the existing report
      if (setReportCreated) {
        setReportCreated({
          id: existingReport.id,
          content: existingReport.content
        });
      }
      return existingReport.id;
    }
    
    // Otherwise, generate a new report
    console.log('Starting new report generation for project:', projectId);
    await handleCreateReport(projectId);
    return null;
  };

  return {
    existingReport,
    isStaleReport,
    reportCreated,
    creatingReport,
    generationInProgress,
    handleGenerateReport,
    navigateToReport,
    getStatus,
    getMessage,
    getProgress
  };
};
