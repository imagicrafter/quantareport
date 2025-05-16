
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface ReportSectionsProps {
  loading: boolean;
  error: string | null;
}

const ReportSections = ({ loading, error }: ReportSectionsProps) => {
  return (
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
  );
};

export default ReportSections;
