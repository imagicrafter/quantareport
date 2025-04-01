
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

  // Check for job completion directly from the database
  const checkJobCompletion = useCallback(async (jobId: string) => {
    if (!jobId) return false;
    
    try {
      console.log(`Checking completion status for job: ${jobId}`);
      
      const { data, error } = await supabase
        .from('report_progress')
        .select('*')
        .eq('job', jobId)
        .or('progress.eq.100,status.eq.completed,status.eq.error')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error checking job completion:', error);
        return false;
      }
      
      if (data && data.length > 0) {
        console.log('Found completion record:', data[0]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in checkJobCompletion:', error);
      return false;
    }
  }, []);

  // Setup realtime subscription to track file analysis progress
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
        
        // Show toast with progress update message
        if (payload.new) {
          // Don't show toast for the initial "Starting..." message to avoid too many notifications
          if (payload.new.progress > 5) {
            toast.info(payload.new.message || 'Processing files...', {
              description: `Progress: ${payload.new.progress}%`
            });
          }
          
          // Always check if we've reached 100% or completion status
          if (payload.new.status === 'completed' || 
              payload.new.status === 'error' || 
              payload.new.progress >= 100
          ) {
            console.log('File analysis completed via realtime!', payload.new);
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

  // Add multiple backup checks to ensure we don't leave the button spinning
  useEffect(() => {
    if (!isAnalyzing || !currentJobId) return;
    
    console.log('Setting up backup completion checks...');
    
    // Check every 10 seconds for job completion
    const checkInterval = setInterval(async () => {
      console.log(`Running interval check for job completion: ${currentJobId}`);
      
      const isCompleted = await checkJobCompletion(currentJobId);
      
      if (isCompleted) {
        console.log('Interval check found completed state!');
        setIsAnalyzing(false);
        toast.success('File analysis completed');
        checkUnprocessedFiles();
        clearInterval(checkInterval);
      }
    }, 10000);
    
    // Final fallback: timeout after 180 seconds (3 minutes) regardless
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback timeout reached - forcing completion');
      if (isAnalyzing) {
        setIsAnalyzing(false);
        toast.info('File analysis timeout reached', { 
          description: 'The operation may have completed silently'
        });
        checkUnprocessedFiles();
      }
    }, 180000);
    
    return () => {
      clearInterval(checkInterval);
      clearTimeout(fallbackTimeout);
    };
  }, [isAnalyzing, currentJobId, checkUnprocessedFiles, checkJobCompletion]);

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
      
      // Show initial toast
      toast.info('Starting file analysis...', {
        description: 'This may take a few minutes to complete'
      });
      
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
  }, [projectId, projectName, checkUnprocessedFiles]);

  return {
    isAnalyzing,
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles
  };
};
