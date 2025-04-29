
import { supabase } from '@/integrations/supabase/client';
import { ProjectFile, FileType } from '../FileItem';

export const fetchFiles = async (projectId: string): Promise<ProjectFile[]> => {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  
  return data.map(file => ({
    ...file,
    type: file.type as FileType
  })) as ProjectFile[];
};

export const fetchMostCurrentFiles = async (projectId: string): Promise<ProjectFile[]> => {
  const { data, error } = await supabase
    .from('v_files_most_current')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(file => ({
    ...file,
    type: file.type as FileType
  })) as ProjectFile[];
};
