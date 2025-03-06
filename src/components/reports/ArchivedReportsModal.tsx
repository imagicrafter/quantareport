
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Report, fetchReports, updateReport } from './ReportService';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ArchivedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportStatusChange: () => void;
}

const ArchivedReportsModal = ({ isOpen, onClose, onReportStatusChange }: ArchivedReportsModalProps) => {
  const [archivedReports, setArchivedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadArchivedReports();
    }
  }, [isOpen]);

  const loadArchivedReports = async () => {
    try {
      setIsLoading(true);
      const allReports = await fetchReports();
      const archived = allReports.filter(report => report.status === 'archived');
      setArchivedReports(archived);
    } catch (error) {
      console.error('Error fetching archived reports:', error);
      toast.error('Failed to load archived reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnarchive = async (reportId: string) => {
    try {
      setProcessingId(reportId);
      await updateReport(reportId, { status: 'draft' });
      toast.success('Report unarchived successfully');
      
      // Update the local state
      setArchivedReports(prev => prev.filter(report => report.id !== reportId));
      
      // Notify parent component to refresh reports list
      onReportStatusChange();
    } catch (error) {
      console.error('Error unarchiving report:', error);
      toast.error('Failed to unarchive report');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Archived Reports</SheetTitle>
          <SheetDescription>
            Reports will be stored in the archive for 14 days
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : archivedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No archived reports found
            </div>
          ) : (
            archivedReports.map(report => (
              <div 
                key={report.id} 
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <h4 className="font-medium">{report.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {formatDate(report.last_edited_at)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUnarchive(report.id)}
                  disabled={processingId === report.id}
                >
                  {processingId === report.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Un-archive'}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ArchivedReportsModal;
