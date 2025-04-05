
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReportGenerationProgress from '@/components/reports/ReportGenerationProgress';

interface FileAnalysisProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  projectId: string;
  fileCount: number;
  onAnalysisComplete?: () => void;
}

const FileAnalysisProgressModal = ({
  isOpen,
  onClose,
  jobId,
  projectId,
  fileCount,
  onAnalysisComplete
}: FileAnalysisProgressModalProps) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Starting file analysis...');
  const [subscription, setSubscription] = useState<any>(null);
  const hasRefreshedRef = useRef(false);
  const analysisCompletedRef = useRef(false);

  useEffect(() => {
    if (isOpen && jobId) {
      setStatus('generating');
      hasRefreshedRef.current = false;
      analysisCompletedRef.current = false;
      setupRealtimeSubscription();
    } else {
      cleanupSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [isOpen, jobId]);

  useEffect(() => {
    // Handle completion state
    if (status === 'completed' && !analysisCompletedRef.current) {
      analysisCompletedRef.current = true;
      
      // Execute onAnalysisComplete only once
      if (!hasRefreshedRef.current && onAnalysisComplete) {
        console.log('Analysis completed, triggering refresh');
        hasRefreshedRef.current = true;
        onAnalysisComplete();
      }
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [status, onClose, onAnalysisComplete]);

  const setupRealtimeSubscription = () => {
    if (!jobId) return;
    
    // Create a unique channel name with timestamp to avoid conflicts
    const channelName = `file-analysis-progress-${jobId}-${Date.now()}`;
    console.log(`Setting up realtime subscription on channel: ${channelName} for job: ${jobId}`);
    
    // Create initial progress record if it doesn't exist
    createInitialProgressRecord();
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_progress',
          filter: `job=eq.${jobId}`
        },
        (payload) => {
          console.log('Received progress update for file analysis:', payload);
          const latestProgress = payload.new;
          setMessage(latestProgress.message || 'Processing files...');
          setProgress(latestProgress.progress || 0);
          setStatus(latestProgress.status as any);

          if (latestProgress.status === 'completed' || latestProgress.status === 'error') {
            handleAnalysisCompletion(latestProgress.status === 'completed');
          }
          
          // If progress is 100%, also consider it complete even if status hasn't changed yet
          if (latestProgress.progress === 100 && latestProgress.status === 'generating') {
            setMessage('Image Processing Completed');
            handleAnalysisCompletion(true);
          }
        }
      )
      .subscribe((status) => {
        console.log(`File analysis subscription status for ${channelName}:`, status);
      });
      
    setSubscription(channel);
  };
  
  const createInitialProgressRecord = async () => {
    if (!jobId) return;
    
    // Check if there's already a progress record for this job
    const { data, error } = await supabase
      .from('report_progress')
      .select('*')
      .eq('job', jobId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error checking for existing progress records:', error);
      return;
    }
    
    // If no progress record exists, create an initial one
    if (!data || data.length === 0) {
      console.log('Creating initial progress record for job:', jobId);
      const { error: insertError } = await supabase
        .from('report_progress')
        .insert({
          job: jobId,
          status: 'generating',
          message: 'Starting file analysis...',
          progress: 5
        });
        
      if (insertError) {
        console.error('Error creating initial progress record:', insertError);
      }
    } else {
      // Use the existing progress record to update the UI
      const latestProgress = data[0];
      setMessage(latestProgress.message || 'Processing files...');
      setProgress(latestProgress.progress || 0);
      setStatus(latestProgress.status as any);
      
      console.log('Found existing progress record:', latestProgress);
      
      if (latestProgress.status === 'completed' || latestProgress.status === 'error') {
        handleAnalysisCompletion(latestProgress.status === 'completed');
      }
      
      // If progress is 100%, also consider it complete
      if (latestProgress.progress === 100) {
        setMessage('Image Processing Completed');
        handleAnalysisCompletion(true);
      }
    }
  };

  const cleanupSubscriptions = () => {
    if (subscription) {
      console.log('Removing file analysis progress subscription');
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  };

  const handleAnalysisCompletion = async (isSuccess: boolean) => {
    // Prevent multiple executions
    if (analysisCompletedRef.current) {
      return;
    }
    
    analysisCompletedRef.current = true;
    console.log('Analysis completion handler executed, success:', isSuccess);
    
    // Clean up subscriptions
    cleanupSubscriptions();
    
    // Check for remaining unprocessed files only once
    await checkRemainingFiles();
    
    // If successful and not refreshed yet, trigger onAnalysisComplete callback to refresh files
    if (isSuccess && !hasRefreshedRef.current && onAnalysisComplete) {
      console.log('Triggering onAnalysisComplete callback');
      hasRefreshedRef.current = true;
      onAnalysisComplete();
    }
    
    // Set status to completed to trigger modal close
    setStatus('completed');
  };
  
  const checkRemainingFiles = async () => {
    try {
      // Check if we still have unprocessed files
      const { data: filesData, error: filesError } = await supabase
        .from('files_not_processed')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      if (!filesError) {
        if (!filesData || filesData.length === 0) {
          // No more unprocessed files
          toast.success('All files analyzed successfully');
        } else {
          // Some files failed to process
          setMessage('Some files could not be processed. You can try analyzing again.');
        }
      }
    } catch (error) {
      console.error('Error checking remaining files:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md" aria-describedby="analysis-progress-description">
        <DialogHeader>
          <DialogTitle>Analyzing Files</DialogTitle>
          <DialogDescription id="analysis-progress-description">
            Processing files for analysis. This may take a few minutes depending on the number of files.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <ReportGenerationProgress
            progress={progress}
            message={message}
            status={status}
          />
          <p className="text-sm text-muted-foreground mt-4">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} queued for analysis
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileAnalysisProgressModal;
