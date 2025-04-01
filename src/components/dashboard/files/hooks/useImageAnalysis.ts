
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types for progress data
interface ProgressData {
  progress: number;
  message: string;
  status: string;
  job: string;
}

export const useImageAnalysis = (projectId: string, projectName: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasUnprocessedFiles, setHasUnprocessedFiles] = useState(false);
  const [unprocessedFileCount, setUnprocessedFileCount] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

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
      // Prevent multiple analysis processes
      if (isAnalyzing) {
        console.log('Analysis already in progress');
        return;
      }
      
      setIsAnalyzing(true);
      
      // Determine if this is a test project
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      // Generate a job ID
      const jobId = crypto.randomUUID();
      setCurrentJobId(jobId);
      
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
      
      if (!data.success) {
        toast.error(data.message || 'Failed to start file analysis');
        setIsAnalyzing(false);
      }
      
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error('An error occurred while analyzing files');
      setIsAnalyzing(false);
    }
  }, [projectId, projectName, isAnalyzing]);

  return {
    isAnalyzing,
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles,
    currentJobId
  };
};
