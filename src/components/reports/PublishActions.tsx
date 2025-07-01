
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, ExternalLink, Trash2 } from 'lucide-react';
import { publishReport, unpublishReport } from '@/services/publishedReportsService';
import { useToast } from '@/components/ui/use-toast';

interface PublishActionsProps {
  reportId: string;
  reportTitle: string;
  reportContent: string;
  isPublished: boolean;
  publishedToken?: string;
  onStatusChange?: () => void;
}

const PublishActions = ({ 
  reportId, 
  reportTitle, 
  reportContent, 
  isPublished, 
  publishedToken,
  onStatusChange 
}: PublishActionsProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const { toast } = useToast();

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishReport(reportId, reportTitle, reportContent);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Report published successfully!',
        });
        onStatusChange?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to publish report',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const result = await unpublishReport(reportId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Report unpublished successfully!',
        });
        onStatusChange?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to unpublish report',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleOpenPublished = () => {
    if (publishedToken) {
      const url = `${window.location.origin}/reports/${publishedToken}`;
      window.open(url, '_blank');
    }
  };

  if (isPublished && publishedToken) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenPublished}
          title="Open Published Report"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnpublish}
          disabled={isUnpublishing}
          title="Unpublish Report"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePublish}
      disabled={isPublishing}
      title="Publish Report"
    >
      <Upload className="h-4 w-4" />
    </Button>
  );
};

export default PublishActions;
