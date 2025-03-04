
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { fetchReports } from '@/components/reports/ReportService';
import ReportsTable from '@/components/reports/ReportsTable';
import { Report } from '@/components/reports/ReportService';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CreateReportModal from '@/components/reports/CreateReportModal';

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleCreateNewReport = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    // Refresh reports list after modal is closed
    loadReports();
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Reports" toggleSidebar={() => {}} />
      
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reports</h1>
          <Button onClick={handleCreateNewReport}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
        
        <ReportsTable reports={reports} isLoading={isLoading} />
        
        <CreateReportModal 
          isOpen={showCreateModal} 
          onClose={handleCloseModal} 
        />
      </div>
    </div>
  );
};

export default Reports;
