
import { useState, useEffect, useRef } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import FilesSectionHeader from './files/components/FilesSectionHeader';
import FilesContainer from './files/components/FilesContainer';
import AddFileDialog from './files/AddFileDialog';
import EditFileDialog from './files/EditFileDialog';
import DeleteFileDialog from './files/DeleteFileDialog';
import BulkUploadDialog from './files/BulkUploadDialog';
import FileAnalysisProgressModal from './files/FileAnalysisProgressModal';
import { useFiles } from './files/hooks/useFiles';
import { useFileOperations } from './files/hooks/useFileOperations';
import { useImageAnalysis } from './files/hooks/useImageAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile } from './files/FileItem';

interface FilesSectionProps {
  projectId: string;
  projectName?: string;
}

const FilesSection = ({ projectId, projectName = '' }: FilesSectionProps) => {
  const { files, setFiles, loading, loadFiles } = useFiles(projectId);
  const {
    uploading,
    selectedFile,
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    isBulkUploadDialogOpen,
    setSelectedFile,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setIsBulkUploadDialogOpen,
    handleAddFile,
    handleEditFile,
    handleDeleteFile,
    handleReorderFiles,
    handleBulkUploadFiles,
    handleUploadFromDriveLink,
  } = useFileOperations(projectId, loadFiles);

  const {
    isAnalyzing,
    analysisJobId,
    hasUnprocessedFiles,
    unprocessedFileCount,
    isProgressModalOpen,
    checkUnprocessedFiles,
    analyzeFiles,
    closeProgressModal,
    handleAnalysisComplete
  } = useImageAnalysis(projectId, projectName);

  const [analyzedFileIds, setAnalyzedFileIds] = useState<Set<string>>(new Set());
  const refreshInProgressRef = useRef(false);

  // Check for unprocessed files when the component mounts or files are updated
  useEffect(() => {
    if (projectId) {
      checkUnprocessedFiles();
      fetchAnalyzedFiles();
    }
  }, [projectId, checkUnprocessedFiles]);

  // Get project name if not provided
  const [fetchedProjectName, setFetchedProjectName] = useState('');
  
  useEffect(() => {
    if (projectId && !projectName) {
      const fetchProjectName = async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();
          
        if (!error && data) {
          setFetchedProjectName(data.name);
        }
      };
      
      fetchProjectName();
    }
  }, [projectId, projectName]);

  // Fetch files that have been analyzed
  const fetchAnalyzedFiles = async () => {
    if (!projectId) return;
    
    try {
      // Get all files for this project that are NOT in the unprocessed table
      const { data: unprocessedFiles, error: unprocessedError } = await supabase
        .from('files_not_processed')
        .select('id')
        .eq('project_id', projectId);
        
      if (unprocessedError) {
        console.error('Error fetching unprocessed files:', unprocessedError);
        return;
      }
      
      // Create a set of unprocessed file IDs
      const unprocessedFileIds = new Set(unprocessedFiles?.map(file => file.id) || []);
      
      // Get all file IDs for this project
      const { data: allFiles, error: allFilesError } = await supabase
        .from('files')
        .select('id')
        .eq('project_id', projectId)
        .eq('type', 'image');
        
      if (allFilesError) {
        console.error('Error fetching all files:', allFilesError);
        return;
      }
      
      // Files that have been analyzed are those that exist in all files but not in unprocessed files
      const analyzedIds = new Set(
        allFiles
          ?.filter(file => !unprocessedFileIds.has(file.id))
          .map(file => file.id) || []
      );
      
      setAnalyzedFileIds(analyzedIds);
      
    } catch (error) {
      console.error('Error in fetchAnalyzedFiles:', error);
    }
  };

  const effectiveProjectName = projectName || fetchedProjectName;

  const onReorderFiles = async (result: DropResult) => {
    const reorderedFiles = await handleReorderFiles(result, files);
    if (reorderedFiles) {
      setFiles(reorderedFiles);
    }
  };

  const onAnalysisComplete = () => {
    if (refreshInProgressRef.current) {
      return; // Prevent multiple refreshes
    }
    
    console.log("Refreshing files after analysis completion");
    refreshInProgressRef.current = true;
    
    // Execute the refresh
    loadFiles();
    fetchAnalyzedFiles();
    
    // Reset the flag after a delay to allow for future refreshes
    setTimeout(() => {
      refreshInProgressRef.current = false;
    }, 2000);
  };

  // Add isAnalyzed property to files
  const filesWithAnalysisStatus: ProjectFile[] = files.map(file => ({
    ...file,
    isAnalyzed: file.type === 'image' && analyzedFileIds.has(file.id)
  }));

  return (
    <div className="flex flex-col h-full">
      <FilesSectionHeader 
        onAddFile={() => setIsAddDialogOpen(true)}
        onBulkUpload={() => setIsBulkUploadDialogOpen(true)}
        projectId={projectId}
        onAnalyzeFiles={analyzeFiles}
        hasUnprocessedFiles={hasUnprocessedFiles}
      />

      <FilesContainer 
        files={filesWithAnalysisStatus}
        loading={loading}
        onEditFile={(file) => {
          setSelectedFile(file);
          setIsEditDialogOpen(true);
        }}
        onDeleteFile={(file) => {
          setSelectedFile(file);
          setIsDeleteDialogOpen(true);
        }}
        onReorderFiles={onReorderFiles}
      />

      <AddFileDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFile={handleAddFile}
        uploading={uploading}
        projectId={projectId}
      />

      <EditFileDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onEditFile={handleEditFile}
        selectedFile={selectedFile}
        uploading={uploading}
      />

      <DeleteFileDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteFile}
        uploading={uploading}
      />

      <BulkUploadDialog
        isOpen={isBulkUploadDialogOpen}
        onClose={() => setIsBulkUploadDialogOpen(false)}
        onUploadFiles={handleBulkUploadFiles}
        onUploadFromLink={handleUploadFromDriveLink}
        uploading={uploading}
        projectId={projectId}
      />

      <FileAnalysisProgressModal
        isOpen={isProgressModalOpen}
        onClose={closeProgressModal}
        jobId={analysisJobId}
        projectId={projectId}
        fileCount={unprocessedFileCount}
        onAnalysisComplete={onAnalysisComplete}
      />
    </div>
  );
};

export default FilesSection;
