
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Archive } from 'lucide-react';
import { fetchReports } from '@/components/reports/ReportService';
import ReportsTable from '@/components/reports/ReportsTable';
import { Report } from '@/components/reports/ReportService';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CreateReportModal from '@/components/reports/CreateReportModal';
import ArchivedReportsModal from '@/components/reports/ArchivedReportsModal';
import StatCards from '@/components/dashboard/StatCards';
import { supabase } from '@/integrations/supabase/client';

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
    fetchProjects();

    // Set up a periodic refresh to catch status changes
    const refreshInterval = setInterval(() => {
      loadReports(false); // Silent refresh without loading indicator
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.session.user.id);

      if (!error) {
        setAllProjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const loadReports = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const reportData = await fetchReports();
      // Filter out archived reports for main view
      const activeReports = reportData.filter(report => report.status !== 'archived');
      setReports(activeReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
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
    <div className="min-h-screen relative">
      <DashboardHeader title="Reports" toggleSidebar={() => {}} />
      
      <div className="container mx-auto py-8 space-y-8">
        <StatCards projects={allProjects} />
        
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
        
        <ArchivedReportsModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          onReportStatusChange={loadReports}
        />
      </div>
      
      {/* Archive cabinet button at bottom right */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={() => setShowArchiveModal(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          variant="outline"
          title="Archived Reports"
        >
          <Archive className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Reports;
