
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ReportEditor from '@/components/reports/ReportEditor';

const ReportEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
          No report ID provided.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b">
        <div className="container mx-auto py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/reports')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </div>
      <ReportEditor reportId={id} />
    </div>
  );
};

export default ReportEditorPage;
