
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportsTable from '@/components/reports/ReportsTable';
import CreateReportModal from '@/components/reports/CreateReportModal';
import ArchivedReportsModal from '@/components/reports/ArchivedReportsModal';
import { checkPendingExport } from '@/utils/googleDocsExport';
import { Report, fetchReports } from '@/components/reports/ReportService';

const Reports = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for pending Google Docs export after OAuth redirect
  useEffect(() => {
    checkPendingExport();
  }, []);

  // Fetch reports on component mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const fetchedReports = await fetchReports();
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger 
            value="archived" 
            onClick={() => setIsArchivedModalOpen(true)}
          >
            Archived
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ReportsTable 
            reports={reports.filter(report => report.status !== 'archived')}
            isLoading={isLoading} 
          />
        </TabsContent>
        
        <TabsContent value="draft">
          <ReportsTable 
            reports={reports.filter(report => report.status === 'draft')}
            isLoading={isLoading} 
          />
        </TabsContent>
        
        <TabsContent value="published">
          <ReportsTable 
            reports={reports.filter(report => report.status === 'published')}
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
      
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <ArchivedReportsModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        onReportStatusChange={loadReports}
      />
    </div>
  );
};

export default Reports;
