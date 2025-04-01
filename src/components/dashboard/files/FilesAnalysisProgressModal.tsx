
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReportGenerationProgress from '@/components/reports/ReportGenerationProgress';

interface FilesAnalysisProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  projectId: string;
  fileCount: number;
}

const FilesAnalysisProgressModal = ({
  isOpen,
  onClose,
  jobId,
  projectId,
  fileCount
}: FilesAnalysisProgressModalProps) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Starting file analysis...');
  const [subscription, setSubscription] = useState<any>(null);
  const [contentCheckInterval, setContentCheckInterval] = useState<number | null>(null);

  // Reset state when modal opens with new job
  useEffect(() => {
    if (isOpen && jobId) {
      setStatus('generating');
      setProgress(0);
      setMessage('Starting file analysis...');
      console.log(`Opening progress modal for job: ${jobId}`);
      setupSubscription();
    } else {
      cleanupSubscription();
    }

    return () => {
      cleanupSubscription();
    };
  }, [isOpen, jobId]);

  const cleanupSubscription = () => {
    console.log('Cleaning up subscriptions and intervals');
    if (subscription) {
      console.log('Removing channel:', subscription.topic);
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
    if (contentCheckInterval) {
      window.clearInterval(contentCheckInterval);
      setContentCheckInterval(null);
    }
  };

  const setupSubscription = async () => {
    if (!jobId) return;
    
    console.log(`Setting up subscription for file analysis progress updates on job ${jobId}`);
    
    // Get initial status to handle cases where events might have been missed
    try {
      const { data: initialStatus, error: initialStatusError } = await supabase
        .from('report_progress')
        .select('*')
        .eq('job', jobId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (!initialStatusError && initialStatus && initialStatus.length > 0) {
        console.log('Initial status found:', initialStatus[0]);
        const update = initialStatus[0];
        setMessage(update.message || 'Processing files...');
        setProgress(update.progress || 0);
        setStatus(update.status as any || 'generating');
        
        // If analysis is already complete, close the modal after a delay
        if (update.status === 'completed' || update.status === 'error' || update.progress >= 100) {
          console.log('Analysis already completed, closing modal...');
          setTimeout(() => {
            checkUnprocessedFiles();
          }, 1500);
          return;
        }
      } else {
        console.log('No initial status found for job:', jobId);
      }
    } catch (err) {
      console.error('Error checking initial status:', err);
    }
    
    // Create a unique channel name with timestamp to avoid conflicts
    const channelName = `file-progress-${jobId}-${Date.now()}`;
    console.log(`Creating channel with name: ${channelName}`);
    
    // Set up real-time subscription
    const newSubscription = supabase
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
          const update = payload.new;
          console.log('Received progress update:', update);
          setMessage(update.message || 'Processing files...');
          setProgress(update.progress || 0);
          setStatus(update.status as any || 'generating');
          
          if (update.status === 'completed' || update.status === 'error' || update.progress >= 100) {
            console.log('File analysis completed, checking for unprocessed files...');
            checkUnprocessedFiles();
          }
        }
      )
      .subscribe((status) => {
        console.log(`Channel ${channelName} subscription status:`, status);
      });
      
    setSubscription(newSubscription);
    console.log('Subscription set up successfully');
    
    // Set up polling interval as backup
    const interval = window.setInterval(() => {
      checkProgress(jobId);
    }, 2000); // Check every 2 seconds
    
    setContentCheckInterval(interval);
  };

  const checkProgress = async (job: string) => {
    try {
      // Check for job progress
      console.log(`Polling progress for job: ${job}`);
      const { data, error } = await supabase
        .from('report_progress')
        .select('*')
        .eq('job', job)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking job progress:', error);
        return;
      }

      if (data && data.length > 0) {
        const latestProgress = data[0];
        
        // Log progress updates for debugging
        console.log("Progress update received from polling:", {
          status: latestProgress.status,
          progress: latestProgress.progress,
          message: latestProgress.message,
          job: latestProgress.job
        });
        
        setMessage(latestProgress.message || 'Processing files...');
        setProgress(latestProgress.progress || 0);
        setStatus(latestProgress.status as any || 'generating');

        if (latestProgress.status === 'completed' || latestProgress.status === 'error' || latestProgress.progress >= 100) {
          checkUnprocessedFiles();
        }
      } else {
        console.log(`No progress updates found for job: ${job}`);
      }
    } catch (error) {
      console.error('Error in progress checking:', error);
    }
  };

  const checkUnprocessedFiles = async () => {
    try {
      // Check if we still have unprocessed files
      const { data: filesData, error: filesError } = await supabase
        .from('files_not_processed')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      if (!filesError) {
        if (!filesData || filesData.length === 0) {
          // No more unprocessed files, close the modal after a delay
          console.log("All files processed successfully, closing modal...");
          setTimeout(() => {
            onClose();
            toast.success('All files analyzed successfully');
          }, 1500);
        } else {
          // Some files failed to process
          console.log(`Still have ${filesData.length} unprocessed files`);
          setMessage('Some files could not be processed. You can try analyzing again.');
        }
      }

      // Clean up subscription regardless of result
      cleanupSubscription();
    } catch (error) {
      console.error('Error checking unprocessed files:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analyzing Files</DialogTitle>
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

export default FilesAnalysisProgressModal;
