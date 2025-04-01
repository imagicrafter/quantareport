
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useImageAnalysis = (projectId: string, projectName: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasUnprocessedFiles, setHasUnprocessedFiles] = useState(false);
  const [unprocessedFileCount, setUnprocessedFileCount] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  // Use string | number | null to accommodate Sonner toast IDs
  const [lastToastId, setLastToastId] = useState<string | number | null>(null);

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

  // Check for progress updates from the database - this is the most reliable method
  const checkJobProgress = useCallback(async (jobId: string) => {
    if (!jobId) return null;
    
    try {
      console.log(`Checking latest progress for job: ${jobId}`);
      
      const { data, error } = await supabase
        .from('report_progress')
        .select('*')
        .eq('job', jobId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error checking job progress:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        console.log('Current progress data:', data[0]);
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error in checkJobProgress:', error);
      return null;
    }
  }, []);

  // Check specifically for job completion
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
        
        // Clear any existing toast and show completion toast
        if (lastToastId) {
          toast.dismiss(lastToastId);
          setLastToastId(null);
        }
        
        if (data[0].progress === 100 || data[0].status === 'completed') {
          toast.success('File analysis completed successfully');
          return true;
        } else if (data[0].status === 'error') {
          toast.error(data[0].message || 'Error analyzing files');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error in checkJobCompletion:', error);
      return false;
    }
  }, [lastToastId]);

  // Setup realtime subscription to track file analysis progress
  useEffect(() => {
    if (!currentJobId) return;
    
    console.log(`Setting up realtime subscription for file analysis job: ${currentJobId}`);
    
    // Create a unique channel for this job
    const channel = supabase
      .channel(`job-progress-${currentJobId}`)
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE)
        schema: 'public',
        table: 'report_progress',
        filter: `job=eq.${currentJobId}`,
      }, (payload) => {
        console.log('Received progress update via realtime:', payload);
        
        if (!payload.new) return;
        
        const progressData = payload.new;
        
        // Clear any existing toast to avoid duplicates
        if (lastToastId) {
          toast.dismiss(lastToastId);
        }
        
        // Handle normal progress updates
        if (progressData.progress < 100 && progressData.status !== 'completed' && progressData.status !== 'error') {
          const id = toast.info(progressData.message || 'Processing files...', {
            description: `Progress: ${progressData.progress}%`
          });
          setLastToastId(id);
        }
        // Handle completion or error
        else if (progressData.progress >= 100 || progressData.status === 'completed' || progressData.status === 'error') {
          console.log('Analysis job completed!', progressData);
          setIsAnalyzing(false);
          
          if (progressData.status === 'error') {
            toast.error(progressData.message || 'Error analyzing files');
          } else {
            toast.success('File analysis completed successfully');
          }
          
          // Update unprocessed files count
          checkUnprocessedFiles();
          
          // Clean up subscription
          supabase.removeChannel(channel);
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status: ${status}`);
      });
    
    // Initial progress check when setting up subscription
    checkJobProgress(currentJobId).then(progressData => {
      if (progressData) {
        // If job is already complete, update UI accordingly
        if (progressData.progress >= 100 || progressData.status === 'completed' || progressData.status === 'error') {
          setIsAnalyzing(false);
          
          if (progressData.status === 'error') {
            toast.error(progressData.message || 'Error analyzing files');
          } else {
            toast.success('File analysis completed successfully');
          }
          
          // Clean up subscription early
          supabase.removeChannel(channel);
        }
      }
    });
    
    // Polling backup in case realtime fails
    const progressInterval = setInterval(async () => {
      const isComplete = await checkJobCompletion(currentJobId);
      if (isComplete) {
        console.log('Polling detected job completion');
        setIsAnalyzing(false);
        clearInterval(progressInterval);
        supabase.removeChannel(channel);
      }
    }, 5000); // Check every 5 seconds
    
    // Fallback timeout - no job should take more than 3 minutes
    const fallbackTimeout = setTimeout(() => {
      console.log('Analysis timeout reached');
      setIsAnalyzing(false);
      toast.info('File analysis timeout reached', { 
        description: 'The operation may have completed silently'
      });
      clearInterval(progressInterval);
      supabase.removeChannel(channel);
    }, 180000); // 3 minutes
    
    // Cleanup function
    return () => {
      console.log('Cleaning up resources for job:', currentJobId);
      clearInterval(progressInterval);
      clearTimeout(fallbackTimeout);
      supabase.removeChannel(channel);
    };
  }, [currentJobId, checkUnprocessedFiles, checkJobCompletion, checkJobProgress, lastToastId]);

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
      const jobId = uuidv4();
      setCurrentJobId(jobId);
      
      console.log(`Starting file analysis for project ${projectId} with job ${jobId}`);
      
      // Dismiss any previous toast messages
      if (lastToastId) {
        toast.dismiss(lastToastId);
      }
      
      // Show initial toast
      const initialToastId = toast.info('Starting file analysis...', {
        description: 'This may take a few minutes to complete'
      });
      setLastToastId(initialToastId);
      
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
      
      // Immediately check progress in case the job completed quickly
      setTimeout(async () => {
        const isComplete = await checkJobCompletion(jobId);
        if (isComplete) {
          setIsAnalyzing(false);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error('An error occurred while analyzing files');
      setIsAnalyzing(false);
    }
  }, [projectId, projectName, isAnalyzing, lastToastId, checkJobCompletion]);

  return {
    isAnalyzing,
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles
  };
};
