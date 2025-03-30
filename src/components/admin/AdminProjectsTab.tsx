import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
import ProjectViewDrawer from '../dashboard/ProjectViewDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface Template {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  date: string;
  imageCount: number;
  noteCount: number;
  reportStatus: string;
  template?: Template | null;
  user?: {
    email: string;
  } | null;
}

const pageSizeOptions = [10, 25, 50, 100];

const AdminProjectsTab = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedOwner, setSelectedOwner] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  
  // Available filter options
  const [owners, setOwners] = useState<{email: string, id: string}[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch all projects for admin (not filtered by user_id)
      const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          created_at, 
          status,
          template_id,
          user_id,
          templates(id, name),
          profiles(email)
        `);

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects. Please try again.');
        setLoading(false);
        return;
      }

      // Get notes count and image count for each project
      const projectsWithCounts = await Promise.all((projectData || []).map(async (project) => {
        // Count notes
        const { count: noteCount, error: noteError } = await supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id);

        if (noteError) console.error('Error counting notes:', noteError);

        // Count image files
        const { count: imageCount, error: imageError } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('type', 'image');

        if (imageError) console.error('Error counting images:', imageError);

        return {
          id: project.id,
          name: project.name,
          date: project.created_at,
          reportStatus: project.status,
          noteCount: noteCount || 0,
          imageCount: imageCount || 0,
          template: project.templates,
          user: project.profiles
        };
      }));

      setProjects(projectsWithCounts);
      
      // Extract unique owners, templates, and statuses for filters
      const uniqueOwners = Array.from(new Set(projectData?.map(p => p.profiles?.email)))
        .filter(Boolean)
        .map(email => ({
          email: email as string,
          id: projectData?.find(p => p.profiles?.email === email)?.user_id as string
        }));
      
      const uniqueTemplates = Array.from(
        new Map(projectData?.filter(p => p.templates).map(p => [p.templates.id, p.templates])).values()
      ) as Template[];
      
      const uniqueStatuses = Array.from(new Set(projectData?.map(p => p.status))).filter(Boolean) as string[];
      
      setOwners(uniqueOwners);
      setTemplates(uniqueTemplates);
      setStatuses(uniqueStatuses);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);
  
  useEffect(() => {
    let result = [...projects];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(project => 
        project.name.toLowerCase().includes(query)
      );
    }
    
    // Apply date range filter
    if (dateFrom) {
      result = result.filter(project => 
        new Date(project.date) >= dateFrom
      );
    }
    
    if (dateTo) {
      // Add one day to include the end date fully
      const adjustedDateTo = new Date(dateTo);
      adjustedDateTo.setDate(adjustedDateTo.getDate() + 1);
      
      result = result.filter(project => 
        new Date(project.date) < adjustedDateTo
      );
    }
    
    // Apply owner filter
    if (selectedOwner) {
      result = result.filter(project => 
        project.user?.email === owners.find(o => o.id === selectedOwner)?.email
      );
    }
    
    // Apply template filter
    if (selectedTemplate) {
      result = result.filter(project => 
        project.template?.id === selectedTemplate
      );
    }
    
    // Apply status filter
    if (selectedStatus) {
      result = result.filter(project => 
        project.reportStatus === selectedStatus
      );
    }
    
    setFilteredProjects(result);
    setTotalPages(Math.max(1, Math.ceil(result.length / pageSize)));
    setCurrentPage(1); // Reset to first page when filters change
  }, [projects, searchQuery, dateFrom, dateTo, selectedOwner, selectedTemplate, selectedStatus, pageSize]);

  const handleViewProject = (projectId: string) => {
    setSelectedProject(projectId);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    // Refresh projects after closing the view drawer
    fetchProjects();
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedOwner(undefined);
    setSelectedTemplate(undefined);
    setSelectedStatus(undefined);
  };
  
  // Calculate paginated projects
  const paginatedProjects = filteredProjects.slice(
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
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex gap-2">
            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateFrom && dateTo ? (
                    <span>
                      {format(dateFrom, 'MMM d')} - {format(dateTo, 'MMM d, yyyy')}
                    </span>
                  ) : dateFrom ? (
                    <span>From {format(dateFrom, 'MMM d, yyyy')}</span>
                  ) : dateTo ? (
                    <span>Until {format(dateTo, 'MMM d, yyyy')}</span>
                  ) : (
                    <span>Date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  <h4 className="font-medium">Date range</h4>
                  <div className="flex flex-col gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Start date</div>
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">End date</div>
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
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
            
            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Owner</TableHead> 
                <TableHead className="w-[15%]">Template</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : paginatedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((project) => (
                  <TableRow key={project.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                    <TableCell>
                      <div className="font-medium break-words">{project.name}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(project.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.user?.email || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="break-words">{project.template?.name || 'None'}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {project.imageCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {project.noteCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.reportStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : project.reportStatus === 'processing' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.reportStatus.charAt(0).toUpperCase() + project.reportStatus.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProject(project.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination controls */}
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
              {filteredProjects.length > 0
                ? `${(currentPage - 1) * pageSize + 1}-${Math.min(
                    currentPage * pageSize,
                    filteredProjects.length
                  )} of ${filteredProjects.length}`
                : '0 results'}
            </span>
          </div>
          
          {totalPages > 1 && (
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
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectViewDrawer 
          open={isViewOpen}
          onClose={handleCloseView}
          projectId={selectedProject}
        />
      )}
    </>
  );
};

export default AdminProjectsTab;
