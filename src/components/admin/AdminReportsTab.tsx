
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import Button from '../ui-elements/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportStatus } from '../reports/ReportService';

// Extended report interface for admin view with display properties
interface AdminReport {
  id: string;
  title: string;
  status: ReportStatus;
  created_at: string;
  last_edited_at: string | null;
  project_id: string;
  user_id: string;
  content: string;
  // Display properties
  owner: string;
  project: string;
  template: string;
  template_id: string;
}

interface Profile {
  email: string;
  id: string;
}

interface Template {
  id: string;
  name: string;
}

const pageSizeOptions = [10, 25, 50, 100];

const AdminReportsTab = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  
  // Available filter options
  const [owners, setOwners] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch all reports for admin (not filtered by user_id)
      const { data: reportData, error } = await supabase
        .from('reports')
        .select(`
          id, 
          title, 
          status,
          created_at,
          last_edited_at,
          project_id,
          template_id,
          user_id,
          content,
          templates(id, name),
          profiles(email),
          projects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load reports. Please try again.');
        setLoading(false);
        return;
      }

      // Transform data for display
      const formattedReports = reportData.map(report => ({
        id: report.id,
        title: report.title,
        status: report.status as ReportStatus,
        created_at: report.created_at,
        last_edited_at: report.last_edited_at,
        project_id: report.project_id,
        user_id: report.user_id,
        content: report.content || '',
        // Display properties
        owner: report.profiles?.email || 'Unknown',
        project: report.projects?.name || 'Unknown',
        template: report.templates?.name || 'None',
        template_id: report.template_id
      }));

      setReports(formattedReports);
      
      // Extract unique owners for filters
      const uniqueOwners = Array.from(new Set(reportData?.map(p => p.profiles?.email)))
        .filter(Boolean)
        .map(email => ({
          email: email as string,
          id: reportData?.find(p => p.profiles?.email === email)?.user_id as string
        }));
      
      // Extract unique templates for filters
      const uniqueTemplates = Array.from(
        new Map(reportData?.filter(p => p.templates).map(p => [p.templates.id, p.templates])).values()
      ) as Template[];
      
      setOwners(uniqueOwners);
      setTemplates(uniqueTemplates);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);
  
  useEffect(() => {
    let result = [...reports];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(report => 
        report.title.toLowerCase().includes(query) ||
        report.project.toLowerCase().includes(query)
      );
    }
    
    // Apply owner filter
    if (selectedOwner && selectedOwner !== 'all') {
      result = result.filter(report => 
        report.user_id === selectedOwner
      );
    }
    
    // Apply template filter
    if (selectedTemplate && selectedTemplate !== 'all') {
      result = result.filter(report => 
        report.template_id === selectedTemplate
      );
    }
    
    setFilteredReports(result);
    setTotalPages(Math.max(1, Math.ceil(result.length / pageSize)));
    setCurrentPage(1); // Reset to first page when filters change
  }, [reports, searchQuery, selectedOwner, selectedTemplate, pageSize]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedOwner(undefined);
    setSelectedTemplate(undefined);
  };
  
  const handleViewReport = (reportId: string) => {
    navigate(`/dashboard/reports/editor/${reportId}`);
  };
  
  // Calculate paginated reports
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );
  
  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Show up to 5 page numbers at a time
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search reports by title or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex gap-2">
            {/* Owner filter */}
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Template filter */}
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Reset filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="whitespace-nowrap"
            >
              Reset filters
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Edited</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading reports...
                  </TableCell>
                </TableRow>
              ) : paginatedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No reports found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((report) => (
                  <TableRow key={report.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                    <TableCell>
                      <div className="font-medium break-words">{report.title}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.project}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.owner}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.template}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(report.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {report.last_edited_at ? format(new Date(report.last_edited_at), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : report.status === 'draft' 
                            ? 'bg-blue-100 text-blue-800'
                            : report.status === 'archived'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-amber-100 text-amber-800'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-sm text-muted-foreground ml-4">
                {filteredReports.length > 0
                  ? `${(currentPage - 1) * pageSize + 1}-${Math.min(
                      currentPage * pageSize,
                      filteredReports.length
                    )} of ${filteredReports.length}`
                  : '0 results'}
              </span>
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map(pageNum => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReportsTab;
