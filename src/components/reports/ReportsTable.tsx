
import { useState, useEffect } from 'react';
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
import { PublishedReport, fetchPublishedReports } from '@/services/publishedReportsService';
import { Eye, Search, Edit } from 'lucide-react';
import { format } from 'date-fns';
import PublishActions from './PublishActions';

interface ReportsTableProps {
  reports: Report[];
  isLoading: boolean;
}

const ReportsTable = ({ reports, isLoading }: ReportsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
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

  const loadPublishedReports = async () => {
    const published = await fetchPublishedReports();
    setPublishedReports(published);
  };

  useEffect(() => {
    loadPublishedReports();
  }, []);

  const getPublishedInfo = (reportId: string) => {
    const published = publishedReports.find(p => p.report_id === reportId);
    return published ? { isPublished: true, token: published.token } : { isPublished: false };
  };

  const handleStatusChange = () => {
    loadPublishedReports();
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
              <TableHead className="w-[40%]">Title</TableHead>
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
              filteredReports.map((report) => {
                const publishedInfo = getPublishedInfo(report.id);
                return (
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
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/dashboard/reports/editor/${report.id}`)}
                          title="Edit Report"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <PublishActions
                          reportId={report.id}
                          reportTitle={report.title}
                          reportContent={report.content}
                          isPublished={publishedInfo.isPublished}
                          publishedToken={publishedInfo.token}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
