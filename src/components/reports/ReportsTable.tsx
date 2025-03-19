
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Report } from './ReportService';
import { Eye, FileDown, Search } from 'lucide-react';
import { format } from 'date-fns';
import { initiateGoogleDocsExport } from '@/utils/googleDocsExport';
import { toast } from 'sonner';

export interface ReportsTableProps {
  reports: Report[];
  isLoading: boolean;
}

const ReportsTable = ({ reports, isLoading }: ReportsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredReports = reports.filter(
    report => report.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  const handleExportToGoogleDocs = (reportId: string) => {
    try {
      initiateGoogleDocsExport(reportId);
      toast.info('Preparing to export to Google Docs...');
    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
      toast.error('Failed to export to Google Docs');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Reports</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Title</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Edited</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading reports...
                </TableCell>
              </TableRow>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell>{report.last_edited_at ? formatDate(report.last_edited_at) : 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      report.status === 'published' ? 'bg-green-100 text-green-800' :
                      report.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/dashboard/reports/editor/${report.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportToGoogleDocs(report.id)}
                    >
                      <FileDown className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm ? 'No reports found matching your search.' : 'No reports yet. Create your first report!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReportsTable;
