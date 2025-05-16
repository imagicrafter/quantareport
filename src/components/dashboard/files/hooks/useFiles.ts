
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ProjectFile } from '../FileItem';
import { fetchFiles as fetchFilesService } from '../FileService';

export const useFiles = (projectId?: string) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const [fileToEdit, setFileToEdit] = useState<ProjectFile | null>(null);

  const fetchFiles = async () => {
    if (!projectId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await fetchFilesService(projectId);
      const sortedFiles = [...data].sort((a, b) => (a.position || 0) - (b.position || 0));
      setFiles(sortedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // For compatibility with existing code
  const loadFiles = fetchFiles;
  
  const handleRefresh = () => {
    fetchFiles();
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  return { 
    files, 
    setFiles, 
    loading, 
    loadFiles, 
    fetchFiles,
    fileToDelete, 
    setFileToDelete, 
    fileToEdit, 
    setFileToEdit, 
    handleRefresh 
  };
};
