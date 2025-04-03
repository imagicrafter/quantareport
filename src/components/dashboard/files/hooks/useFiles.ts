
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ProjectFile } from '../FileItem';
import { fetchFiles } from '../FileService';

export const useFiles = (projectId: string) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchFiles(projectId);
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

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  return { files, setFiles, loading, loadFiles };
};
