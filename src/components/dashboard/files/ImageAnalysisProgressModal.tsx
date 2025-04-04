
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export interface ImageAnalysisProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  projectId: string;
  fileCount?: number;
}

const ImageAnalysisProgressModal = ({ 
  isOpen, 
  onClose, 
  jobId, 
  projectId,
  fileCount = 0
}: ImageAnalysisProgressModalProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !jobId) return;

    let subscription: any = null;

    const subscribe = async () => {
      subscription = supabase
        .channel(`analysis_job_${jobId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'report_progress',
          filter: `job=eq.${jobId}`
        }, payload => {
          const { progress: newProgress, status: newStatus, message: newMessage } = payload.new;
          setProgress(newProgress || 0);
          setStatus(newStatus);
          setMessage(newMessage);
          
          if (newStatus === 'completed') {
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        })
        .subscribe();
    };

    subscribe();
    
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isOpen, jobId, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Analyzing Images</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Processing'}</span>
              <span>{progress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {message || 'Please wait while we analyze your images. This may take 3-5 minutes.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageAnalysisProgressModal;
