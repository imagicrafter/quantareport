
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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

  // Setup realtime subscription to track file analysis progress
  // Note: This uses the report_progress table which is a general-purpose progress tracking table,
  // not just for reports. Each job has a unique ID that we use to track progress.
  useEffect(() => {
    if (!currentJobId) return;
    
    console.log(`Setting up realtime subscription for file analysis job: ${currentJobId}`);
    
    // Create a unique channel name for this job
    const channelName = `file-analysis-progress-${currentJobId}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'report_progress',
        filter: `job=eq.${currentJobId}`,
      }, (payload) => {
        console.log('Received file analysis progress update:', payload);
        
        if (payload.new && (
            payload.new.status === 'completed' || 
            payload.new.status === 'error' || 
            payload.new.progress >= 100
        )) {
          console.log('File analysis completed!', payload.new);
          setIsAnalyzing(false);
          
          // Show appropriate toast based on status
          if (payload.new.status === 'error') {
            toast.error(payload.new.message || 'Error analyzing files');
          } else {
            toast.success('All files analyzed successfully');
          }
          
          // Check for unprocessed files to update UI
          checkUnprocessedFiles();
          
          // Clean up the subscription
          supabase.removeChannel(channel);
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });
    
    // Clean up subscription when component unmounts or job changes
    return () => {
      console.log(`Cleaning up subscription for job: ${currentJobId}`);
      supabase.removeChannel(channel);
    };
  }, [currentJobId, checkUnprocessedFiles]);

  const analyzeFiles = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      
      // Determine if this is a test project
      const isTestMode = projectName.toLowerCase().includes('test');
      console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for project: ${projectName}`);
      
      // Generate a job ID
      const jobId = uuidv4();
      setCurrentJobId(jobId); // Store for realtime subscription
      
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
      
      if (data.success) {
        toast.success('File analysis started');
        
        // Set up a backup check in case realtime fails
        setTimeout(() => {
          if (isAnalyzing) {
            console.log('Performing backup check for completion...');
            checkUnprocessedFiles().then(hasUnprocessed => {
              if (!hasUnprocessed) {
                console.log('Backup check: All files appear to be processed');
                setIsAnalyzing(false);
                toast.success('All files analyzed successfully');
              } else {
                console.log(`Backup check: Still have ${unprocessedFileCount} unprocessed files`);
              }
            });
          }
        }, 30000); // 30 second backup check
      } else {
        toast.error(data.message || 'Failed to start file analysis');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error('An error occurred while analyzing files');
      setIsAnalyzing(false);
    }
  }, [projectId, projectName, checkUnprocessedFiles, isAnalyzing, unprocessedFileCount]);

  return {
    isAnalyzing,
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles
  };
};
