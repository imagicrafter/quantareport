
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid package

export const useImageAnalysis = (projectId: string, projectName: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [hasUnprocessedFiles, setHasUnprocessedFiles] = useState(false);
  const [unprocessedFileCount, setUnprocessedFileCount] = useState(0);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const checkUnprocessedFiles = useCallback(async () => {
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
    try {
      setIsAnalyzing(true);
      
      // Determine if this is a test project
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      // Generate a new job ID using uuid package
      const jobId = uuidv4();
      setAnalysisJobId(jobId); // Set job ID immediately to ensure it's available for the modal
      
      console.log(`Starting file analysis for project ${projectId} with job ${jobId}`);
      
      // Call the file-analysis edge function
      const { data, error } = await supabase.functions.invoke('file-analysis', {
        body: {
          project_id: projectId,
          isTestMode,
          job: jobId
        }
      });
      
      if (error) {
        console.error('Error invoking file-analysis function:', error);
        toast.error('Failed to start file analysis');
        setIsAnalyzing(false);
        return;
      }
      
      console.log('File analysis response:', data);
      
      // First set the job ID and open the modal, regardless of the response
      setIsProgressModalOpen(true);
      
      if (data.success) {
        toast.success('File analysis started');
      } else {
        toast.error(data.message || 'Failed to start file analysis');
      }
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error('An error occurred while analyzing files');
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, projectName]);

  const closeProgressModal = useCallback(() => {
    setIsProgressModalOpen(false);
    setAnalysisJobId(null); // Reset job ID when modal is closed
    checkUnprocessedFiles();
  }, [checkUnprocessedFiles]);

  return {
    isAnalyzing,
    analysisJobId,
    hasUnprocessedFiles,
    unprocessedFileCount,
    isProgressModalOpen,
    checkUnprocessedFiles,
    analyzeFiles,
    closeProgressModal
  };
};
