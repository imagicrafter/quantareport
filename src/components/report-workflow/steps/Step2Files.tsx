
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FileUploadArea from '../file-upload/FileUploadArea';
import UploadedFilesTable from '../file-upload/UploadedFilesTable';
import StepBanner from '../StepBanner';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';

const Step2Files = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const location = useLocation();
  const { toast } = useToast();

  // Function to get the most recent active workflow
  const fetchActiveWorkflow = async () => {
    try {
      console.log('Step2Files - Fetching current user and active workflow');
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.error('Step2Files - No authenticated user found');
        return null;
      }
      
      const userId = userData.user.id;
      
      // Query the most recent workflow state for step 2
      const { data: workflowData, error: workflowError } = await supabase
        .from('project_workflow')
        .select('project_id, last_edited_at')
        .eq('user_id', userId)
        .eq('workflow_state', 2)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .single();
      
      if (workflowError) {
        console.error('Step2Files - Error fetching workflow data:', workflowError);
        return null;
      }
      
      console.log('Step2Files - Found active workflow:', workflowData);
      return workflowData?.project_id || null;
    } catch (error) {
      console.error('Step2Files - Error in fetchActiveWorkflow:', error);
      return null;
    }
  };

  // Get project ID and set up page
  useEffect(() => {
    const setupStep = async () => {
      setIsLoading(true);
      
      try {
        // First try to get project ID from location state (passed from previous step)
        const projectIdFromState = location.state?.projectId;
        
        if (projectIdFromState) {
          console.log('Step2Files - Using project ID from location state:', projectIdFromState);
          setProjectId(projectIdFromState);
          
          // Update workflow state to Step 2 if coming from different step
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData.user) {
            // Update or create workflow state
            const { data: existingWorkflow } = await supabase
              .from('project_workflow')
              .select('id')
              .eq('project_id', projectIdFromState)
              .maybeSingle();
              
            if (existingWorkflow) {
              // Update existing workflow
              await supabase
                .from('project_workflow')
                .update({ 
                  workflow_state: 2,
                  last_edited_at: new Date().toISOString()
                })
                .eq('project_id', projectIdFromState);
            } else {
              // Create new workflow
              await supabase
                .from('project_workflow')
                .insert({
                  project_id: projectIdFromState,
                  user_id: userData.user.id,
                  workflow_state: 2,
                  last_edited_at: new Date().toISOString()
                });
            }
          }
        } else {
          // If no project ID in state, try to fetch from database
          console.log('Step2Files - No project ID in state, fetching from database');
          const activeProjectId = await fetchActiveWorkflow();
          
          if (activeProjectId) {
            console.log('Step2Files - Using project ID from database:', activeProjectId);
            setProjectId(activeProjectId);
          } else {
            console.error('Step2Files - No project ID found in state or database');
            toast({
              title: "Missing Project",
              description: "Could not find an active project. Please start a new report.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Step2Files - Error setting up step:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupStep();
  }, [location, toast]);

  // Fetch uploaded files when projectId changes
  useEffect(() => {
    const fetchFiles = async () => {
      if (!projectId) return;
      
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Step2Files - Error fetching files:', error);
          return;
        }
        
        console.log('Step2Files - Fetched files:', data);
        
        // Map the database results to match the ProjectFile interface
        // This ensures that 'type' is correctly cast to the FileType type
        if (data) {
          const mappedFiles: ProjectFile[] = data.map(file => ({
            id: file.id,
            name: file.name,
            title: file.title,
            description: file.description,
            file_path: file.file_path,
            type: file.type as FileType, // Cast the string to FileType
            size: file.size,
            created_at: file.created_at,
            project_id: file.project_id,
            user_id: file.user_id,
            position: file.position,
            metadata: file.metadata
          }));
          
          setUploadedFiles(mappedFiles);
        }
      } catch (error) {
        console.error('Step2Files - Error in fetchFiles:', error);
      }
    };
    
    fetchFiles();
  }, [projectId]);

  const handleFilesUploaded = (newFiles: ProjectFile[]) => {
    setUploadedFiles((prev) => [...newFiles, ...prev]);
  };

  const handleNextStep = async () => {
    if (!projectId) return;
    
    try {
      // Update workflow state to 3 (process files step)
      const { error } = await supabase
        .from('project_workflow')
        .update({ 
          workflow_state: 3,
          last_edited_at: new Date().toISOString()
        })
        .eq('project_id', projectId);
        
      if (error) {
        console.error('Step2Files - Error updating workflow state:', error);
        toast({
          title: "Error",
          description: "Failed to proceed to next step. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Navigate to next step
      window.location.href = `/dashboard/report-wizard/process?projectId=${projectId}`;
    } catch (error) {
      console.error('Step2Files - Error in handleNextStep:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold mb-2">No Active Project</h3>
        <p>Please start a new report first to upload files.</p>
        <Button
          className="mt-4"
          onClick={() => window.location.href = '/dashboard/report-wizard/start'}
        >
          Start New Report
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepBanner 
        step={2}
        isActive={true}
        onClick={() => {}}
      />
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Upload Files</h2>
        <p className="text-muted-foreground">Add photos, documents, or audio files to your report.</p>
      </div>
      
      <FileUploadArea 
        onFilesSelected={handleFilesUploaded} 
        acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
        files={[]}
      />
      
      <UploadedFilesTable 
        files={uploadedFiles} 
        loading={false}
      />
      
      <div className="flex justify-end max-w-4xl mx-auto mt-8">
        <Button
          onClick={handleNextStep}
          disabled={uploadedFiles.length === 0}
        >
          Next: Process Files
        </Button>
      </div>
    </div>
  );
};

export default Step2Files;
