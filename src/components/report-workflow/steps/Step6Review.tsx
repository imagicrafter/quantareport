
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share2, Printer, Mail, Edit } from 'lucide-react';
import InstructionsPanel from '../start-report/InstructionsPanel';
import { useToast } from '@/components/ui/use-toast';

const Step6Review = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;
  
  const handleBack = () => {
    navigate('/dashboard/report-wizard/generate');
  };
  
  const handleFinish = () => {
    toast({
      title: "Report completed",
      description: "Your report has been finalized and saved."
    });
    navigate('/dashboard/reports');
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
          <h2 className="text-xl font-semibold">Property Inspection Report</h2>
          
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
                <div className="aspect-[8.5/11] bg-white p-8 border-b relative">
                  {/* Mock report page content */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-1">Property Inspection Report</h1>
                    <p className="text-muted-foreground">123 Example Street, Anytown, CA</p>
                    <p className="text-sm text-muted-foreground">Inspection Date: April 10, 2025</p>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Executive Summary</h2>
                    <p className="mb-4">
                      This report presents the findings of a thorough inspection conducted on the property
                      located at 123 Example Street. The property is in generally good condition with a few
                      items requiring attention as detailed in this report.
                    </p>
                    <p>
                      The inspection included assessment of the structure, roof, foundation, plumbing,
                      electrical systems, HVAC, and general interior and exterior conditions.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Key Findings</h2>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Roof shows signs of aging with some shingles needing replacement</li>
                      <li>Water heater is approaching end of useful life</li>
                      <li>Minor cracks in driveway need sealing</li>
                      <li>HVAC system functioning properly but filter needs replacement</li>
                    </ul>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
                
                {/* Page navigation */}
                <div className="flex justify-between items-center p-4 bg-muted/30">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => changePage('prev')}
                    disabled={currentPage === 1}
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
                    disabled={currentPage === totalPages}
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
                <div className="space-y-4">
                  <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                    <h3 className="font-medium">1. Executive Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Overview of the property and inspection findings
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                    <h3 className="font-medium">2. Exterior Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluation of the property's exterior features
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                    <h3 className="font-medium">3. Interior Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed review of interior components and rooms
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                    <h3 className="font-medium">4. Systems & Components</h3>
                    <p className="text-sm text-muted-foreground">
                      Analysis of electrical, plumbing, and HVAC systems
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                    <h3 className="font-medium">5. Recommendations</h3>
                    <p className="text-sm text-muted-foreground">
                      Suggested repairs and maintenance items
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                    <h3 className="font-medium">6. Appendices</h3>
                    <p className="text-sm text-muted-foreground">
                      Additional documentation and reference materials
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between max-w-4xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button onClick={handleFinish}>
          Finish Report
        </Button>
      </div>
    </div>
  );
};

export default Step6Review;
