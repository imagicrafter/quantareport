
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FilesAnalysisProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  projectId: string;
}

// Define the type for progress data
interface ProgressData {
  message: string;
  progress: number;
  status: string;
}

const FilesAnalysisProgressModal = ({
  isOpen,
  onClose,
  jobId,
  projectId
}: FilesAnalysisProgressModalProps) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Starting file analysis...');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    console.log(`Progress modal opened for job: ${jobId}`);
    
    // Reset state when modal opens
    setProgress(0);
    setMessage('Starting file analysis...');
    setCompleted(false);
    
    // Create a unique channel for this progress modal
    const channel = supabase
      .channel(`modal-progress-${jobId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'report_progress',
        filter: `job=eq.${jobId}`,
      }, (payload) => {
        if (!payload.new) return;
        
        const update = payload.new as ProgressData;
        console.log('Progress update received:', update);
        
        // Safely access properties with default values
        setMessage(update.message || 'Processing files...');
        setProgress(update.progress || 0);
        
        // Check completion or error
        if ((update.progress >= 100) || (update.status === 'completed')) {
          setCompleted(true);
          setTimeout(() => {
            onClose();
            toast.success('File analysis completed successfully');
          }, 1500);
        } else if (update.status === 'error') {
          setCompleted(true);
          setTimeout(() => {
            onClose();
            toast.error(update.message || 'Error analyzing files');
          }, 1500);
        }
      })
      .subscribe((status) => {
        console.log(`Progress modal subscription status: ${status}`);
      });
      
    // Initial check for current progress
    const checkInitialProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('report_progress')
          .select('*')
          .eq('job', jobId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!error && data && data.length > 0) {
          const update = data[0] as ProgressData;
          console.log('Initial progress state:', update);
          
          // Safely access properties with default values
          setMessage(update.message || 'Processing files...');
          setProgress(update.progress || 0);
          
          // Check completion or error
          if ((update.progress >= 100) || (update.status === 'completed') || (update.status === 'error')) {
            setCompleted(true);
            setTimeout(() => {
              onClose();
              if (update.status === 'error') {
                toast.error(update.message || 'Error analyzing files');
              } else {
                toast.success('File analysis completed successfully');
              }
            }, 1500);
          }
        }
      } catch (err) {
        console.error('Error checking initial progress:', err);
      }
    };
    
    checkInitialProgress();
    
    // Poll for progress updates as a backup
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('report_progress')
          .select('*')
          .eq('job', jobId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!error && data && data.length > 0) {
          const update = data[0] as ProgressData;
          
          // Safely access properties with default values
          setMessage(update.message || 'Processing files...');
          setProgress(update.progress || 0);
          
          // Check completion or error
          if ((update.progress >= 100) || (update.status === 'completed') || (update.status === 'error')) {
            setCompleted(true);
            clearInterval(pollInterval);
            setTimeout(() => {
              onClose();
              if (update.status === 'error') {
                toast.error(update.message || 'Error analyzing files');
              } else {
                toast.success('File analysis completed successfully');
              }
            }, 1500);
          }
        }
      } catch (err) {
        console.error('Error polling for progress:', err);
      }
    }, 3000); // Check every 3 seconds
    
    // Cleanup function
    return () => {
      console.log(`Cleaning up progress modal resources for job: ${jobId}`);
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [isOpen, jobId, onClose, projectId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analyzing Files</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <Progress value={progress} className="h-2 mb-4" />
          <p className="text-center font-medium">{message}</p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {completed ? 'Completing...' : `${progress}% complete`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilesAnalysisProgressModal;
