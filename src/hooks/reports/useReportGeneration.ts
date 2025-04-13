
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  generateReport,
  setupReportProgressSubscription,
  checkInitialReportStatus,
  checkReportContent,
  navigateToReportEditor
} from '@/components/reports/services/ReportGenerationService';

export interface ProgressUpdate {
  report_id: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
  progress: number;
  created_at: string;
  job?: string;
}

export const useReportGeneration = () => {
  const [creatingReport, setCreatingReport] = useState<string | null>(null);
  const [generationInProgress, setGenerationInProgress] = useState<{[key: string]: boolean}>({});
  const [reportCreated, setReportCreated] = useState<{id: string, content: string} | null>(null);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
  const navigate = useNavigate();

  const handleCreateReport = useCallback(async (projectId: string) => {
    try {
      if (generationInProgress[projectId]) {
        console.log(`Report generation already in progress for project ${projectId}, skipping duplicate request`);
        return false;
      }
      
      setGenerationInProgress(prev => ({...prev, [projectId]: true}));
      
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
        throw new Error('Authentication required. Please sign in.');
      }
      
      const userId = session.session.user.id;
      
      const result = await generateReport(
        projectId,
        userId,
        setCreatingReport,
        setReportCreated,
        setGenerationInProgress
      );
      
      return result.success;
    } catch (error) {
      console.error('Error in handleCreateReport:', error);
      setCreatingReport(null);
      setGenerationInProgress(prev => {
        const updated = {...prev};
        delete updated[projectId];
        return updated;
      });
      return false;
    }
  }, [generationInProgress]);

  const navigateToReport = useCallback(async () => {
    if (!reportCreated?.id) return;
    return await navigateToReportEditor(reportCreated.id, navigate, () => {
      setReportCreated(null);
      setProgressUpdate(null);
    });
  }, [reportCreated, navigate]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let contentCheckInterval: number | null = null;
    
    const setupSubscription = async () => {
      if (!reportCreated?.id) return;
      
      // Check initial status first
      const isCompleted = await checkInitialReportStatus(
        reportCreated.id,
        setProgressUpdate,
        navigateToReport
      );
      
      if (isCompleted) return;
      
      // If not completed, set up subscription
      cleanup = setupReportProgressSubscription(
        reportCreated.id,
        setProgressUpdate,
        navigateToReport
      );
      
      // Also set up periodic content checks
      contentCheckInterval = window.setInterval(() => {
        if (reportCreated) {
          checkReportContent(
            reportCreated.id,
            reportCreated.content,
            navigateToReport
          );
        }
      }, 5000);
    };
    
    if (reportCreated?.id) {
      setupSubscription();
    }
    
    return () => {
      if (cleanup) {
        cleanup();
      }
      if (contentCheckInterval) {
        window.clearInterval(contentCheckInterval);
      }
    };
  }, [reportCreated, navigateToReport]);

  return {
    creatingReport,
    generationInProgress,
    reportCreated,
    setReportCreated,
    progressUpdate,
    handleCreateReport,
    navigateToReport
  };
};
