import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { fetchReportById, updateReport } from '@/components/reports/ReportService';
import InstructionsPanel from '../start-report/InstructionsPanel';
import ReportActions from '../review/ReportActions';
import ReportPreview from '../review/ReportPreview';
import ReportSections from '../review/ReportSections';
import ExitReviewDialog from '../review/ExitReviewDialog';

const Step6Review = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('Report');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitTarget, setExitTarget] = useState('');
  
  const initializeComponent = useCallback(async () => {
    try {
      setLoading(true);
      
      const { projectId: currentProjectId } = await fetchCurrentWorkflow();
      
      if (!currentProjectId) {
        toast({
          title: "Error",
          description: "No active project found. Please start a new report.",
          variant: "destructive"
        });
        navigate('/dashboard/report-wizard/start');
        return;
      }
      
      setProjectId(currentProjectId);
      
      await updateWorkflowState(currentProjectId, 6);
      
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        setError('Failed to load report data.');
        setLoading(false);
        return;
      }
      
      if (reports.length === 0) {
        setError('No report found for this project.');
        setLoading(false);
        return;
      }
      
      const report = reports[0];
      console.log('Found report:', report.id);
      setReportId(report.id);
      setReportTitle(report.title || 'Report');
      
      if (report.content) {
        setReportContent(report.content);
        const contentLength = report.content.length;
        setTotalPages(Math.max(1, Math.ceil(contentLength / 3000)));
      } else {
        try {
          const fullReport = await fetchReportById(report.id);
          setReportContent(fullReport.content);
          const contentLength = fullReport.content?.length || 0;
          setTotalPages(Math.max(1, Math.ceil(contentLength / 3000)));
        } catch (err) {
          console.error('Error fetching report by ID:', err);
          setError('Failed to load report content. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error initializing Step6Review:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [fetchCurrentWorkflow, navigate, toast, updateWorkflowState]);
  
  useEffect(() => {
    if (!initialized) {
      initializeComponent();
    }
  }, [initialized, initializeComponent]);
  
  const handleBack = async () => {
    if (projectId) {
      await updateWorkflowState(projectId, 5);
      navigate('/dashboard/report-wizard/generate');
    } else {
      navigate('/dashboard/report-wizard/generate');
    }
  };
  
  const handleNavigationAttempt = async (target: string) => {
    if (target === 'edit' || target === 'print' || target === 'finish') {
      return false;
    }

    setExitTarget(target);
    setShowExitDialog(true);
    return true;
  };
  
  const handleDownload = async () => {
    const shouldShowDialog = await handleNavigationAttempt('download');
    
    if (!shouldShowDialog && reportContent) {
      const element = document.createElement('a');
      const file = new Blob([reportContent.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${reportTitle}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };
  
  const handlePrint = () => {
    if (reportContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${reportTitle}</title>
            </head>
            <body>
              ${reportContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  const handleShare = async () => {
    const shouldShowDialog = await handleNavigationAttempt('share');
    
    if (!shouldShowDialog) {
      toast({
        description: "Sharing options will be implemented in a future update."
      });
    }
  };
  
  const handleEdit = async () => {
    if (reportId && projectId) {
      await updateWorkflowState(projectId, 0);
      navigate(`/dashboard/reports/editor/${reportId}`);
    } else {
      toast({
        title: "Error",
        description: "Report ID not found. Cannot open editor.",
        variant: "destructive"
      });
    }
  };
  
  const handleFinish = async () => {
    if (reportId && projectId) {
      try {
        await updateReport(reportId, { status: 'completed' });
        
        toast({
          title: "Report completed",
          description: "Your report has been finalized and saved."
        });
        
        await updateWorkflowState(projectId, 0);
        
        navigate('/dashboard/reports');
      } catch (error) {
        console.error('Error finalizing report:', error);
        toast({
          title: "Error",
          description: "Failed to finalize report. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  const changePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleExitConfirm = async () => {
    if (reportId && projectId) {
      try {
        await updateReport(reportId, { status: 'completed' });
        
        await updateWorkflowState(projectId, 0);
        
        navigate('/dashboard/reports');
      } catch (error) {
        console.error('Error updating report status:', error);
        toast({
          description: "Failed to update report status. Please try again.",
        });
      }
    }
    setShowExitDialog(false);
  };

  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        
        if (!href || href.startsWith('http') || href.startsWith('mailto:')) {
          return;
        }

        if (
          anchor.classList.contains('edit-action') ||
          anchor.classList.contains('print-action')
        ) {
          return;
        }

        e.preventDefault();
        const shouldShowDialog = await handleNavigationAttempt(href);
        if (!shouldShowDialog) {
          navigate(href);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [navigate, reportId, projectId]);

  return (
    <div>
      <InstructionsPanel stepNumber={6} />
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{reportTitle}</h2>
          <ReportActions
            onDownload={handleDownload}
            onShare={handleShare}
            onPrint={handlePrint}
            onEdit={handleEdit}
          />
        </div>
        
        <Tabs defaultValue="preview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            <ReportPreview
              loading={loading}
              error={error}
              reportContent={reportContent}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
            />
          </TabsContent>
          
          <TabsContent value="sections" className="mt-4">
            <ReportSections
              loading={loading}
              error={error}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between max-w-4xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button 
          onClick={handleFinish}
          disabled={loading || !!error}
        >
          Finish Report
        </Button>
      </div>
      
      <ExitReviewDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleExitConfirm}
      />
    </div>
  );
};

export default Step6Review;
