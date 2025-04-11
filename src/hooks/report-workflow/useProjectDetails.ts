
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProjectDetails = (projectId: string | null) => {
  const [projectName, setProjectName] = useState<string>('Untitled Report');
  
  useEffect(() => {
    const fetchProjectName = async () => {
      if (!projectId) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching project name:', error);
          return;
        }
        
        if (data && data.name) {
          setProjectName(data.name);
        }
      } catch (error) {
        console.error('Error in fetchProjectName:', error);
      }
    };
    
    fetchProjectName();
  }, [projectId]);
  
  // Determine page title based on report mode and project
  const getPageTitle = (currentStepIndex: number) => {
    if (!projectId || !projectName) {
      return "Create New Report";
    }
    
    // For step 2 onwards, show the project name
    if (currentStepIndex >= 1) {
      return `Create New Report: ${projectName}`;
    }
    
    return "Create New Report";
  };
  
  return { projectName, getPageTitle };
};
