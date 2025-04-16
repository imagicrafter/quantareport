import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share2, Printer, Mail, Edit, AlertCircle, Loader2 } from 'lucide-react';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { fetchReportById, updateReport } from '@/components/reports/ReportService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  
  const handleDownload = () => {
    if (reportContent) {
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
  
  const handleShare = () => {
    toast({
      description: "Sharing options will be implemented in a future update."
    });
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

  // Add new function to handle navigation attempts
  const handleNavigationAttempt = async (target: string) => {
    // Skip dialog for Edit, Print, and Finish actions
    if (target === 'edit' || target === 'print' || target === 'finish') {
      return false;
    }

    setExitTarget(target);
    setShowExitDialog(true);
    return true;
  };

  // Add function to handle exit confirmation
  const handleExitConfirm = async () => {
    if (reportId && projectId) {
      try {
        // Update report status to completed
        await updateReport(reportId, { status: 'completed' });
        
        // Reset workflow state to 0
        await updateWorkflowState(projectId, 0);
        
        // Navigate to dashboard reports
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

  // Add click handler to document
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        
        if (!href || href.startsWith('http') || href.startsWith('mailto:')) {
          return;
        }

        // Allow normal operation for edit and print actions
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

  // Add ExitDialog component
  const ExitDialog = () => (
    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit Report Creation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark your report as completed. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleExitConfirm}>Yes, Exit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Update the button click handlers to include navigation checks
  const handleShare = async () => {
    await handleNavigationAttempt('share');
  };

  const handleDownload = async () => {
    await handleNavigationAttempt('download');
  };
  
  return (
    <div>
      <InstructionsPanel stepNumber={6} />
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{reportTitle}</h2>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print-action">
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit} className="edit-action">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="preview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
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
                  <div className="aspect-[8.5/11] bg-white p-8 border-b relative" style={{ textAlign: 'left' }}>
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
                    onClick={() => changePage('prev')}
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
                    onClick={() => changePage('next')}
                    disabled={currentPage === totalPages || loading || !!error}
                  >
                    Next Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sections" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center p-8">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                      <h3 className="font-medium">1. Executive Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        Overview of the property and inspection findings
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                      <h3 className="font-medium">2. Assessment</h3>
                      <p className="text-sm text-muted-foreground">
                        Evaluation of key areas and components
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                      <h3 className="font-medium">3. Findings</h3>
                      <p className="text-sm text-muted-foreground">
                        Detailed review of issues and observations
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                      <h3 className="font-medium">4. Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Suggested actions and improvements
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                      <h3 className="font-medium">5. Appendices</h3>
                      <p className="text-sm text-muted-foreground">
                        Additional documentation and reference materials
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
      
      <ExitDialog />
    </div>
  );
};

export default Step6Review;
