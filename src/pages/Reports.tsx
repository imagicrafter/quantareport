
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { fetchReports, createReport } from '@/components/reports/ReportService';
import { generateMockReport } from '@/components/reports/MockReportGenerator';
import ReportsTable from '@/components/reports/ReportsTable';
import { Report } from '@/components/reports/ReportService';
import { supabase } from '@/integrations/supabase/client';

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const reportData = await fetchReports();
      setReports(reportData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewReport = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No active session');
        return;
      }
      
      const userId = session.session.user.id;
      const mockReport = generateMockReport(userId);
      
      const newReport = await createReport(mockReport);
      navigate(`/reports/editor/${newReport.id}`);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={handleCreateNewReport}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>
      
      <ReportsTable reports={reports} isLoading={isLoading} />
    </div>
  );
};

export default Reports;
