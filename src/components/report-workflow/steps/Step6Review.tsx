
import { useState, useEffect } from 'react';
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
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setLoading(true);
        
        // Get current workflow state and project ID
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
        
        // Update workflow state to 6
        await updateWorkflowState(currentProjectId, 6);
        
        // Find the most recent report for this project
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('project_id', currentProjectId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (reportsError) {
          console.error('Error fetching reports:', reportsError);
          setError('Failed to load report data.');
          return;
        }
        
        if (reports.length === 0) {
          setError('No report found for this project.');
          return;
        }
        
        const report = reports[0];
        setReportId(report.id);
        setReportTitle(report.title || 'Report');
        
        // If content exists, use it directly
        if (report.content) {
          setReportContent(report.content);
          // Rough estimate of pages based on content length
          const contentLength = report.content.length;
          setTotalPages(Math.max(1, Math.ceil(contentLength / 3000)));
        } else {
          // Fallback to fetching the report by ID
          const fullReport = await fetchReportById(report.id);
          setReportContent(fullReport.content);
          const contentLength = fullReport.content?.length || 0;
          setTotalPages(Math.max(1, Math.ceil(contentLength / 3000)));
        }
      } catch (error) {
        console.error('Error initializing Step6Review:', error);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeComponent();
  }, [navigate, toast, fetchCurrentWorkflow, updateWorkflowState]);
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/generate');
  };
  
  const handleFinish = async () => {
    if (reportId && projectId) {
      try {
        // Update report status to completed if it's still draft
        await updateReport(reportId, { status: 'completed' });
        
        toast({
          title: "Report completed",
          description: "Your report has been finalized and saved."
        });
        
        // Reset workflow state
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
  
  const handleShare = () => {
    toast({
      description: "Sharing options will be implemented in a future update."
    });
  };
  
  const handleDownload = () => {
    toast({
      description: "Download feature will be implemented in a future update."
    });
  };
  
  const handlePrint = () => {
    toast({
      description: "Print feature will be implemented in a future update."
    });
  };
  
  const handleEmail = () => {
    toast({
      description: "Email feature will be implemented in a future update."
    });
  };
  
  const handleEdit = () => {
    navigate('/dashboard/report-wizard/notes');
  };
  
  const changePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
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
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
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
                  <div className="aspect-[8.5/11] bg-white p-8 border-b relative">
                    {/* Render the actual report content from the database */}
                    <div dangerouslySetInnerHTML={{ __html: reportContent || '' }} />
                    
                    <div className="absolute bottom-4 right-4 text-muted-foreground text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
                
                {/* Page navigation */}
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
    </div>
  );
};

export default Step6Review;
