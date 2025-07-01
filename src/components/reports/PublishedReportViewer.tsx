
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublishedReportByToken } from '@/services/publishedReportsService';
import { Loader2 } from 'lucide-react';

const PublishedReportViewer = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!token) {
        setError('Invalid report URL');
        setLoading(false);
        return;
      }

      try {
        const result = await getPublishedReportByToken(token);
        if (result.error) {
          setError(result.error);
        } else {
          setReport(result.report);
        }
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600">{error || 'The requested report could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: report.reports.content }}
        />
      </div>
    </div>
  );
};

export default PublishedReportViewer;
