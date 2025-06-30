import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentEnvironment, isDevelopmentEnvironment } from '@/utils/webhookConfig';

export const useImageAnalysis = (projectId?: string, projectName?: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [hasUnprocessedFiles, setHasUnprocessedFiles] = useState(false);
  const [unprocessedFileCount, setUnprocessedFileCount] = useState(0);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const refreshInProgressRef = useRef(false);

  const checkUnprocessedFiles = useCallback(async () => {
    if (!projectId) return false;
    
    try {
      const { data, error } = await supabase
        .from('v_files_not_processed')
        .select('id')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error checking unprocessed files:', error);
        return false;
      }

      const hasFiles = data && data.length > 0;
      setHasUnprocessedFiles(hasFiles);
      setUnprocessedFileCount(data?.length || 0);
      return hasFiles;
    } catch (error) {
      console.error('Error in checkUnprocessedFiles:', error);
      return false;
    }
  }, [projectId]);

  const analyzeFiles = useCallback(async (onProgressSetup?: (jobId: string) => void) => {
    if (!projectId || !projectName) {
      toast.error('Project information is missing');
      return null;
    }
    
    try {
      setIsAnalyzing(true);
      setAnalysisInProgress(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        toast.error('Unable to authenticate user for file analysis');
        setIsAnalyzing(false);
        setAnalysisInProgress(false);
        return null;
      }
      
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error('No user ID found');
        toast.error('User authentication required for file analysis');
        setIsAnalyzing(false);
        setAnalysisInProgress(false);
        return null;
      }
      
      const isTestMode = projectName.toLowerCase().includes('test');
      const shouldUseTestMode = isDevelopmentEnvironment() && isTestMode;
      const currentEnv = getCurrentEnvironment();
      
      console.log(`Using ${shouldUseTestMode ? 'TEST' : 'REGULAR'} mode for project: ${projectName} (App Environment: ${currentEnv})`);
      
      const jobId = uuidv4();
      setAnalysisJobId(jobId);
      
      console.log(`Starting file analysis for project ${projectId} with job ${jobId} for user ${userId}`);
      
      // Create initial progress record for better UX
      const { error: progressError } = await supabase
        .from('report_progress')
        .insert({
          job: jobId,
          status: 'generating',
          message: 'Starting file analysis...',
          progress: 5
        });
      
      if (progressError) {
        console.error('Error creating initial progress record:', progressError);
      }

      // Setup real-time subscription if callback provided
      if (onProgressSetup) {
        onProgressSetup(jobId);
      }
      
      const { data, error } = await supabase.functions.invoke('n8n-webhook-proxy/proxy', {
        body: {
          project_id: projectId,
          user_id: userId,
          isTestMode: shouldUseTestMode,
          job: jobId,
          type: 'file-analysis',
          env: shouldUseTestMode ? 'development' : currentEnv,
          payload: {
            project_id: projectId,
            user_id: userId,
            isTestMode: shouldUseTestMode,
            job: jobId
          }
        }
      });
      
      if (error) {
        console.error('Error invoking file-analysis function:', error);
        toast.error('Failed to start file analysis');
        setIsAnalyzing(false);
        setAnalysisInProgress(false);
        return null;
      }
      
      console.log('File analysis response:', data);
      
      if (data.success) {
        toast.success('File analysis started');
        return jobId;
      } else {
        toast.error(data.message || 'Failed to start file analysis');
        return null;
      }
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error('An error occurred while analyzing files');
      return null;
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        setAnalysisInProgress(false);
      }, 5000);
    }
  }, [projectId, projectName]);

  const analyzeImage = useCallback(async (fileId: string) => {
    if (!projectId) {
      toast.error('Project ID is missing');
      return;
    }
    
    try {
      setAnalysisInProgress(true);
      
      // Get the current user to include the user_id in the payload
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        toast.error('Unable to authenticate user for image analysis');
        setAnalysisInProgress(false);
        return;
      }
      
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error('No user ID found');
        toast.error('User authentication required for image analysis');
        setAnalysisInProgress(false);
        return;
      }
      
      // Get the current environment using the utility function
      const currentEnv = getCurrentEnvironment();
      
      // Call the image-analysis edge function using the new consolidated proxy
      const { data, error } = await supabase.functions.invoke('n8n-webhook-proxy/proxy', {
        body: {
          file_id: fileId,
          project_id: projectId,
          user_id: userId, // Include the user_id in the payload
          type: 'file-analysis', // Using file-analysis webhook type
          env: currentEnv, // Use current environment instead of hardcoding
          payload: {
            file_id: fileId,
            project_id: projectId,
            user_id: userId // Include the user_id in the payload
          }
        }
      });
      
      if (error) {
        console.error('Error invoking image-analysis function:', error);
        toast.error('Failed to analyze image');
        return;
      }
      
      console.log('Image analysis response:', data);
      
      if (data.success) {
        toast.success('Image analysis completed');
      } else {
        toast.error(data.message || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('An error occurred while analyzing the image');
    } finally {
      setAnalysisInProgress(false);
    }
  }, [projectId]);

  const closeProgressModal = useCallback(() => {
    setIsProgressModalOpen(false);
    refreshInProgressRef.current = false;
  }, []);
  
  const handleAnalysisComplete = useCallback(() => {
    if (refreshInProgressRef.current) {
      return;
    }
    
    console.log("Analysis complete, refreshing files list (once)");
    refreshInProgressRef.current = true;
    
    // This will be called by FilesSection.tsx
  }, []);

  return {
    isAnalyzing,
    analysisInProgress,
    analysisJobId,
    hasUnprocessedFiles,
    unprocessedFileCount,
    isProgressModalOpen,
    checkUnprocessedFiles,
    analyzeFiles,
    analyzeImage,
    closeProgressModal,
    handleAnalysisComplete
  };
};
