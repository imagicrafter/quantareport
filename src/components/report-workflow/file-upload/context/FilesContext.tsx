
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface FilesContextType {
  files: ProjectFile[];
  isLoading: boolean;
  fetchFiles: (projectId: string) => Promise<void>;
  handleFilesUploaded: (newFiles: ProjectFile[]) => void;
  handleFileDeleted: () => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const mappedFiles: ProjectFile[] = data.map(file => ({
          id: file.id,
          name: file.name,
          title: file.title || '',
          description: file.description || '',
          file_path: file.file_path,
          type: file.type,
          size: file.size,
          created_at: file.created_at,
          project_id: file.project_id,
          user_id: file.user_id,
          position: file.position || 0,
          metadata: file.metadata || {}
        }));
        setFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFilesUploaded = (newFiles: ProjectFile[]) => {
    setFiles(prev => [...newFiles, ...prev]);
  };

  const handleFileDeleted = () => {
    toast({
      title: "Success",
      description: "File deleted successfully",
    });
  };

  return (
    <FilesContext.Provider value={{
      files,
      isLoading,
      fetchFiles,
      handleFilesUploaded,
      handleFileDeleted
    }}>
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
};
