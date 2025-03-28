
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
  
  console.log('Fetched files:', data);

  return data.map(file => ({
    ...file,
    type: file.type as FileType
  })) as ProjectFile[];
};
