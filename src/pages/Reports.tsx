
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportsTable from '@/components/reports/ReportsTable';
import { useState } from 'react';
import CreateReportModal from '@/components/reports/CreateReportModal';
import ArchivedReportsModal from '@/components/reports/ArchivedReportsModal';
import { checkPendingExport } from '@/utils/googleDocsExport';

const Reports = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  
  // Check for pending Google Docs export after OAuth redirect
  useEffect(() => {
    checkPendingExport();
  }, []);

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
          <ReportsTable filter="all" />
        </TabsContent>
        
        <TabsContent value="draft">
          <ReportsTable filter="draft" />
        </TabsContent>
        
        <TabsContent value="published">
          <ReportsTable filter="published" />
        </TabsContent>
      </Tabs>
      
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <ArchivedReportsModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
      />
    </div>
  );
};

export default Reports;
