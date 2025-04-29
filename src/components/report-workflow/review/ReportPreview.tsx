
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

interface ReportPreviewProps {
  loading: boolean;
  error: string | null;
  reportContent: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (direction: 'prev' | 'next') => void;
}

const ReportPreview = ({
  loading,
  error,
  reportContent,
  currentPage,
  totalPages,
  onPageChange,
}: ReportPreviewProps) => {
  return (
    <Card className="border shadow-md">
      <CardContent className="p-0">
        {loading ? (
          <div className="aspect-[8.5/11] bg-white p-8 border-b flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading report content...</p>
            </div>
          </div>
        ) : error ? (
          <div className="aspect-[8.5/11] bg-white p-8 border-b flex items-center justify-center">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        ) : (
          <div className="aspect-[8.5/11] bg-white p-8 border-b relative" style={{ textAlign: 'left' }}> {/* This must stay aligned left */}
            <div dangerouslySetInnerHTML={{ __html: reportContent || '' }} />
            <div className="absolute bottom-4 right-4 text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center p-4 bg-muted/30">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange('prev')}
            disabled={currentPage === 1 || loading || !!error}
          >
            Previous Page
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange('next')}
            disabled={currentPage === totalPages || loading || !!error}
          >
            Next Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportPreview;
