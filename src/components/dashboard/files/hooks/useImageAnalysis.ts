
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const analyzeImages = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      
      // Determine if this is a test project
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      // Generate a new job ID
      const jobId = crypto.randomUUID();
      
      // Call the image-analysis edge function
      const { data, error } = await supabase.functions.invoke('image-analysis', {
        body: {
          project_id: projectId,
          isTestMode,
          job: jobId
        }
      });
      
      if (error) {
        console.error('Error invoking image-analysis function:', error);
        toast.error('Failed to start image analysis');
        setIsAnalyzing(false);
        return;
      }
      
      console.log('Image analysis response:', data);
      
      if (data.success) {
        setAnalysisJobId(data.jobId);
        setIsProgressModalOpen(true);
        toast.success('Image analysis started');
      } else {
        toast.error(data.message || 'Failed to start image analysis');
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('An error occurred while analyzing images');
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, projectName]);

  const closeProgressModal = useCallback(() => {
    setIsProgressModalOpen(false);
    checkUnprocessedFiles();
  }, [checkUnprocessedFiles]);

  return {
    isAnalyzing,
    analysisJobId,
    hasUnprocessedFiles,
    unprocessedFileCount,
    isProgressModalOpen,
    checkUnprocessedFiles,
    analyzeImages,
    closeProgressModal
  };
};
