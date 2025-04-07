
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
        .from('files_not_processed')
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

  const analyzeFiles = useCallback(async () => {
    if (!projectId || !projectName) {
      toast.error('Project information is missing');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setAnalysisInProgress(true);
      
      // Determine if this is a test project
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      // Generate a new job ID using uuid package
      const jobId = uuidv4();
      setAnalysisJobId(jobId);
      
      console.log(`Starting file analysis for project ${projectId} with job ${jobId}`);
      
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
      
      // Call the file-analysis edge function using the new consolidated proxy
      const { data, error } = await supabase.functions.invoke('n8n-webhook-proxy/proxy', {
        body: {
          project_id: projectId,
          isTestMode,
          job: jobId,
          type: 'file-analysis',
          env: isTestMode ? 'development' : 'production',
          payload: {
            project_id: projectId,
            isTestMode,
            job: jobId
          }
        }
      });
      
      if (error) {
        console.error('Error invoking file-analysis function:', error);
        toast.error('Failed to start file analysis');
        setIsAnalyzing(false);
        setAnalysisInProgress(false);
        return;
      }
      
      console.log('File analysis response:', data);
      
      if (data.success) {
        setIsProgressModalOpen(true);
        toast.success('File analysis started');
      } else {
        toast.error(data.message || 'Failed to start file analysis');
      }
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error('An error occurred while analyzing files');
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
      
      // Call the image-analysis edge function using the new consolidated proxy
      const { data, error } = await supabase.functions.invoke('n8n-webhook-proxy/proxy', {
        body: {
          file_id: fileId,
          project_id: projectId,
          type: 'file-analysis', // Using file-analysis webhook type
          env: 'production',
          payload: {
            file_id: fileId,
            project_id: projectId
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
      return; // Prevent multiple refreshes
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
