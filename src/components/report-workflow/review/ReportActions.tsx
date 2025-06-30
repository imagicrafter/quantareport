
import { Button } from '@/components/ui/button';
import { Download, Share2, Printer, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ReportActionsProps {
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  onEdit: () => void;
}

const ReportActions = ({ onDownload, onShare, onPrint, onEdit }: ReportActionsProps) => {
  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download className="h-4 w-4 mr-1" />
        Download
      </Button>
      <Button variant="outline" size="sm" onClick={onShare}>
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
      <Button variant="outline" size="sm" onClick={onPrint} className="print-action">
        <Printer className="h-4 w-4 mr-1" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={onEdit} className="edit-action">
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
    </div>
  );
};

export default ReportActions;
