
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
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      setStatus('generating');
      startPolling();
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [isOpen, jobId]);

  const startPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const checkInterval = window.setInterval(async () => {
      if (!jobId) return;
      await checkProgress(jobId);
    }, 1500);

    setPollingInterval(checkInterval);
  };

  const checkProgress = async (job: string) => {
    try {
      // Check for job progress
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
        setMessage(latestProgress.message || 'Processing files...');
        setProgress(latestProgress.progress || 0);
        setStatus(latestProgress.status as any);

        // Log progress updates for debugging
        console.log("Progress update received:", {
          status: latestProgress.status,
          progress: latestProgress.progress,
          message: latestProgress.message
        });

        if (latestProgress.status === 'completed' || latestProgress.status === 'error') {
          // Check if we still have unprocessed files
          const { data: filesData, error: filesError } = await supabase
            .from('files_not_processed')
            .select('id')
            .eq('project_id', projectId)
            .limit(1);

          if (!filesError) {
            if (!filesData || filesData.length === 0) {
              // No more unprocessed files, close the modal after a delay
              setTimeout(() => {
                onClose();
                toast.success('All files analyzed successfully');
              }, 1500);
            } else {
              // Some files failed to process
              setMessage('Some files could not be processed. You can try analyzing again.');
            }
          }

          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      }
    } catch (error) {
      console.error('Error in progress checking:', error);
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
