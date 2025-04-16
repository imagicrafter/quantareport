import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FileUploadArea from '../file-upload/FileUploadArea';
import UploadedFilesTable from '../file-upload/UploadedFilesTable';
import StepBanner from '../StepBanner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';

const Step2Files = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [pastedText, setPastedText] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchActiveWorkflow = async () => {
    try {
      console.log('Step2Files - Fetching current user and active workflow');
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.error('Step2Files - No authenticated user found');
        return null;
      }
      
      const userId = userData.user.id;
      
      const { data: workflowData, error: workflowError } = await supabase
        .from('project_workflow')
        .select('project_id')
        .eq('user_id', userId)
        .eq('workflow_state', 2)
        .order('last_edited_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (workflowError) {
        console.error('Step2Files - Error fetching workflow data:', workflowError);
        return null;
      }
      
      console.log('Step2Files - Found active workflow with project ID:', workflowData?.project_id);
      return workflowData?.project_id || null;
    } catch (error) {
      console.error('Step2Files - Error in fetchActiveWorkflow:', error);
      return null;
    }
  };

  useEffect(() => {
    const setupStep = async () => {
      setIsLoading(true);
      
      try {
        const activeProjectId = await fetchActiveWorkflow();
        
        if (activeProjectId) {
          console.log('Step2Files - Using project ID from database:', activeProjectId);
          setProjectId(activeProjectId);
          
          const { data: projectData } = await supabase
            .from('projects')
            .select('name')
            .eq('id', activeProjectId)
            .single();
            
          if (projectData) {
            setProjectName(projectData.name);
          }
          
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData.user) {
            const { data: existingWorkflow } = await supabase
              .from('project_workflow')
              .select('id')
              .eq('project_id', activeProjectId)
              .eq('user_id', userData.user.id)
              .maybeSingle();
              
            if (existingWorkflow) {
              await supabase
                .from('project_workflow')
                .update({ 
                  workflow_state: 2,
                  last_edited_at: new Date().toISOString()
                })
                .eq('project_id', activeProjectId)
                .eq('user_id', userData.user.id);
              
              console.log('Step2Files - Updated workflow state to 2');
            } else {
              await supabase
                .from('project_workflow')
                .insert({
                  project_id: activeProjectId,
                  user_id: userData.user.id,
                  workflow_state: 2,
                  last_edited_at: new Date().toISOString()
                });
              
              console.log('Step2Files - Created new workflow with state 2');
            }
          }
        } else {
          console.error('Step2Files - No project ID found in database');
          toast({
            title: "Missing Project",
            description: "Could not find an active project. Please start a new report.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Step2Files - Error setting up step:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupStep();
  }, [toast]);

  const fetchFiles = async () => {
    if (!projectId) return;
    
    try {
      console.log(`Fetching files for project: ${projectId}`);
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
      
      if (data) {
        const mappedFiles: ProjectFile[] = data.map(file => ({
          id: file.id,
          name: file.name,
          title: file.title || '',
          description: file.description || '',
          file_path: file.file_path,
          type: file.type as FileType,
          size: file.size,
          created_at: file.created_at,
          project_id: file.project_id,
          user_id: file.user_id,
          position: file.position || 0,
          metadata: file.metadata || {}
        }));
        
        setUploadedFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Step2Files - Error in fetchFiles:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  const handleFilesUploaded = (newFiles: ProjectFile[]) => {
    console.log("Files uploaded:", newFiles);
    if (projectId) {
      fetchFiles();
    } else {
      setUploadedFiles((prev) => [...newFiles, ...prev]);
    }
  };

  const handleFileDeleted = () => {
    fetchFiles();
  };

  const handleSaveText = async () => {
    if (!projectId || !pastedText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      const now = new Date();
      const datePart = now.toISOString().split('T')[0];
      const randomNumber = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
      
      const fileName = `${projectName}_${datePart}_${randomNumber}.txt`;
      const filePath = `${projectId}/${fileName}`;

      const file = new File([pastedText], fileName, { type: 'text/plain' });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pub_documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = await supabase.storage
        .from('pub_documents')
        .getPublicUrl(filePath);

      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('No authenticated user found');
      }

      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: fileName,
          file_path: urlData.publicUrl,
          type: 'text',
          project_id: projectId,
          user_id: userData.user.id,
          size: file.size,
          metadata: { content: pastedText }
        })
        .select()
        .single();

      if (fileError) {
        throw fileError;
      }

      toast({
        title: "Success",
        description: "Text file saved successfully!",
      });

      setPastedText('');
      fetchFiles();
    } catch (error) {
      console.error('Error saving text file:', error);
      toast({
        title: "Error",
        description: "Failed to save text file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNextStep = async () => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project ID found. Unable to proceed.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast({
          title: "Authentication Error",
          description: "You must be signed in to proceed.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('project_workflow')
        .update({ 
          workflow_state: 3,
          last_edited_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('user_id', userData.user.id);
        
      if (error) {
        console.error('Step2Files - Error updating workflow state:', error);
        toast({
          title: "Error",
          description: "Failed to proceed to next step. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Step2Files - Successfully updated workflow state to 3');
      
      navigate('/dashboard/report-wizard/process');
    } catch (error) {
      console.error('Step2Files - Error in handleNextStep:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
        <p>Could not find an active project for file uploads. Please try starting a new report.</p>
        <Button
          className="mt-4"
          onClick={() => navigate('/dashboard/report-wizard/start')}
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

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="text">Paste Text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <FileUploadArea 
            onFilesSelected={handleFilesUploaded} 
            acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
            files={[]}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="text">
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your text here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="min-h-[200px] w-full p-4"
            />
            <Button
              onClick={handleSaveText}
              disabled={!pastedText.trim()}
              className="w-full"
            >
              Save Text as File
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <UploadedFilesTable 
        files={uploadedFiles} 
        loading={false}
        onFileDeleted={handleFileDeleted}
      />
      
      <div className="flex justify-end max-w-4xl mx-auto mt-8">
        <Button
          onClick={handleNextStep}
          disabled={uploadedFiles.length === 0}
          className="next-step-button"
        >
          Next: Process Files
        </Button>
      </div>
    </div>
  );
};

export default Step2Files;
