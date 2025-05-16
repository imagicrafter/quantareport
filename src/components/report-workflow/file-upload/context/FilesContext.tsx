import React, { createContext, useContext, useState, useCallback } from 'react';
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { fetchMostCurrentFiles } from '@/components/dashboard/files/services/FetchFileService';

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
      setIsLoading(true);
      const data = await fetchMostCurrentFiles(projectId);
      setFiles(data);
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
