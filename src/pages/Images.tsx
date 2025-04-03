
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { Input } from '@/components/ui/input';
import { Search, Filter, List, GridIcon, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileItem from '@/components/dashboard/files/FileItem';
import { useFiles } from '@/components/dashboard/files/hooks/useFiles';
import AddFileDialog from '@/components/dashboard/files/AddFileDialog';
import DeleteFileDialog from '@/components/dashboard/files/DeleteFileDialog';
import EditFileDialog from '@/components/dashboard/files/EditFileDialog';
import BulkUploadDialog from '@/components/dashboard/files/BulkUploadDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageAnalysisProgressModal from '@/components/dashboard/files/ImageAnalysisProgressModal';
import { toast } from 'sonner';
import { useImageAnalysis } from '@/components/dashboard/files/hooks/useImageAnalysis';

const Images = () => {
  const { toast: uiToast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectOptions, setProjectOptions] = useState<{ label: string, value: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  const {
    files,
    loading,
    fileToDelete,
    setFileToDelete,
    fileToEdit,
    setFileToEdit,
    handleRefresh,
    setFiles,
  } = useFiles(selectedProject);

  const {
    analysisInProgress,
    analysisJobId,
    isProgressModalOpen,
    isAnalyzing: analysisIsAnalyzing,
    analyzeImage,
    analyzeFiles,
    closeProgressModal
  } = useImageAnalysis(selectedProject, projectName);

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery
      ? file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesSearch;
  });

  // Function to fetch all projects for the filter dropdown
  const fetchProjects = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', session.session.user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      const options = data.map(project => ({
        label: project.name,
        value: project.id
      }));
      
      setProjectOptions([{ label: 'All Projects', value: 'all' }, ...options]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to load projects. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle project selection
  const handleProjectChange = (projectId: string) => {
    const selectedProjectId = projectId === 'all' ? null : projectId;
    setSelectedProject(selectedProjectId);
    
    if (selectedProjectId) {
      const project = projectOptions.find(p => p.value === selectedProjectId);
      if (project) {
        setProjectName(project.label);
      }
    } else {
      setProjectName('');
    }
  };

  // Handle analyze all images
  const handleAnalyzeAllImages = async () => {
    setIsAnalyzing(true);
    
    try {
      const imagesToAnalyze = filteredFiles.filter(file => file.type === 'image');
      
      if (imagesToAnalyze.length === 0) {
        toast.info('No images to analyze');
        setIsAnalyzing(false);
        return;
      }
      
      await analyzeFiles();
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle dialog functions
  const toggleAddDialog = () => {
    setIsAddDialogOpen(!isAddDialogOpen);
  };

  const toggleBulkUploadDialog = () => {
    setIsBulkUploadOpen(!isBulkUploadOpen);
  };

  // Handle file operations
  const handleFileUploaded = async () => {
    handleRefresh();
  };

  const handleFileUpdated = async () => {
    handleRefresh();
  };

  const handleFileDeleted = async () => {
    handleRefresh();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <>
      <DashboardHeader title="Image Library" toggleSidebar={() => {}} />
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          <div className="flex w-full lg:w-auto space-x-2">
            <div className="relative flex-grow lg:min-w-[300px]">
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="w-[200px]">
              <Select onValueChange={handleProjectChange} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-2 w-full lg:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyzeAllImages}
              disabled={isAnalyzing || analysisInProgress || !selectedProject}
              className="flex items-center"
            >
              {isAnalyzing ? 
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div> : 
                <Filter size={16} className="mr-2" />
              }
              {isAnalyzing ? "Analyzing..." : "Analyze All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBulkUploadDialog}
              disabled={!selectedProject}
              className="flex items-center"
            >
              <Upload size={16} className="mr-2" />
              Bulk Upload
            </Button>
            <Button
              size="sm"
              onClick={toggleAddDialog}
              disabled={!selectedProject}
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Image
            </Button>
            <Tabs defaultValue="grid" className="hidden lg:block" onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="h-8 w-8 p-0">
                  <GridIcon size={16} />
                </TabsTrigger>
                <TabsTrigger value="list" className="h-8 w-8 p-0">
                  <List size={16} />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center p-10 border rounded-lg bg-card">
            <h3 className="text-lg font-medium">No images found</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery 
                ? "No images match your search criteria. Try different keywords."
                : selectedProject 
                  ? "Upload your first image to get started." 
                  : "Select a project to view images."}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
            : "flex flex-col space-y-2"
          }>
            {filteredFiles.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                index={0}
                onDelete={() => setFileToDelete(file)}
                onEdit={() => setFileToEdit(file)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <>
          <AddFileDialog 
            isOpen={isAddDialogOpen} 
            onClose={toggleAddDialog}
            onAddFile={handleFileUploaded}
            uploading={isAnalyzing}
            projectId={selectedProject}
          />

          <BulkUploadDialog
            isOpen={isBulkUploadOpen}
            onClose={toggleBulkUploadDialog}
            onUploadFiles={handleFileUploaded}
            onUploadFromLink={handleFileUploaded}
            uploading={isAnalyzing}
            projectId={selectedProject}
          />
        </>
      )}

      {fileToDelete && (
        <DeleteFileDialog
          isOpen={!!fileToDelete}
          onClose={() => setFileToDelete(null)}
          onDelete={handleFileDeleted}
          uploading={isAnalyzing}
        />
      )}

      {fileToEdit && (
        <EditFileDialog
          isOpen={!!fileToEdit}
          onClose={() => setFileToEdit(null)}
          onEditFile={handleFileUpdated}
          selectedFile={fileToEdit}
          uploading={isAnalyzing}
        />
      )}

      <ImageAnalysisProgressModal 
        isOpen={isProgressModalOpen} 
        onClose={closeProgressModal} 
        jobId={analysisJobId} 
        projectId={selectedProject || ''}
        fileCount={filteredFiles.filter(f => f.type === 'image').length}
      />
    </>
  );
};

export default Images;
