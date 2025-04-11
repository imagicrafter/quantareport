import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import InstructionsPanel from '../start-report/InstructionsPanel';
import FileUploadArea from '../file-upload/FileUploadArea';
import UploadedFilesTable from '../file-upload/UploadedFilesTable';
import { ProjectFile, FileType } from '@/components/dashboard/files/FileItem';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const Step2Files = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  useEffect(() => {
    const fetchProjectFromWorkflow = async () => {
      try {
        console.log('Step2Files - Fetching current user and workflow state');
        
        if (location.state?.projectId) {
          console.log('Step2Files - Using project ID from location state:', location.state.projectId);
          setProjectId(location.state.projectId);
          setInitialLoadComplete(true);
          return;
        }
        
        const user = await supabase.auth.getUser();
        
        if (!user.data.user) {
          console.error('Step2Files - No authenticated user found');
          toast({
            title: "Authentication Error",
            description: "You must be signed in to access this page.",
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }
        
        console.log('Step2Files - Attempting to fetch active workflow via edge function');
        const response = await fetch(`${window.location.origin}/api/workflow-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.getSession()}`
          },
          body: JSON.stringify({
            operation: 'get_latest_workflow',
            userId: user.data.user.id,
            workflowState: 2
          })
        });
        
        const result = await response.json();
        
        if (result.error) {
          console.error('Edge function error:', result.error);
          
          console.log('Step2Files - Falling back to RPC for active workflow');
          const { data, error } = await supabase.rpc('get_active_workflow', {
            p_user_id: user.data.user.id,
            p_workflow_state: 2
          });
          
          if (error) {
            console.error('RPC error:', error);
            
            console.log('Step2Files - Using final fallback method for active workflow');
            
            const { data: rawData, error: rawError } = await supabase
              .from('v_projects_last_update')
              .select(`
                project_id,
                last_update
              `)
              .eq('project_id', supabase.rpc('get_projects_in_state', { state_param: 2 }))
              .order('last_update', { ascending: false })
              .limit(1);
            
            if (rawError) {
              console.error('Final fallback error:', rawError);
              throw new Error('Could not retrieve active workflow');
            }
            
            if (rawData && rawData.length > 0) {
              const workflowProjectId = rawData[0].project_id;
              console.log('Step2Files - Found project ID using fallback:', workflowProjectId);
              setProjectId(workflowProjectId);
            } else {
              console.log('No active project found in workflow state 2');
              navigate('/dashboard/report-wizard/start', { replace: true });
              toast({
                title: "No Active Project",
                description: "Please start a new report.",
                variant: "destructive"
              });
              return;
            }
          } else if (data) {
            console.log('Step2Files - RPC found active workflow:', data);
            setProjectId(data.project_id);
          } else {
            console.log('Step2Files - No active workflow found');
            navigate('/dashboard/report-wizard/start', { replace: true });
            toast({
              title: "No Active Project",
              description: "Please start a new report first.",
              variant: "destructive"
            });
            return;
          }
        } else if (result.data) {
          console.log('Step2Files - Edge function found active workflow:', result.data);
          setProjectId(result.data.project_id);
        } else {
          console.log('Step2Files - No active workflow found via edge function');
          navigate('/dashboard/report-wizard/start', { replace: true });
          toast({
            title: "No Active Project",
            description: "Please start a new report first.",
            variant: "destructive"
          });
          return;
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Step2Files - Error in fetchProjectFromWorkflow:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the project.",
          variant: "destructive"
        });
      }
    };
    
    fetchProjectFromWorkflow();
  }, []);
  
  useEffect(() => {
    if (projectId && initialLoadComplete) {
      console.log('Step2Files - Fetching files for project:', projectId);
      fetchUploadedFiles(projectId);
    }
  }, [projectId, initialLoadComplete]);
  
  const fetchUploadedFiles = async (id: string) => {
    if (!id) {
      console.log('Step2Files - fetchUploadedFiles called but no projectId provided');
      return;
    }
    
    setLoading(true);
    console.log('Step2Files - Fetching files for project:', id);
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', id)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Step2Files - Error fetching files:', error);
        throw error;
      }
      
      console.log('Step2Files - Fetched files for project:', id, data);
      
      const typedFiles = data?.map(file => ({
        ...file,
        type: file.type as FileType
      })) || [];
      
      setUploadedFiles(typedFiles);
    } catch (error) {
      console.error('Step2Files - Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded files.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prevFiles => {
      const existingFileNames = prevFiles.map(f => f.name);
      const newFiles = files.filter(file => !existingFileNames.includes(file.name));
      
      return [...prevFiles, ...newFiles];
    });
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project ID found. Please start a new report.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    const initialProgress: FileUploadProgress[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(initialProgress);
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        setUploadProgress(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, status: 'uploading' } : item
          )
        );
        
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const fileType = getFileType(fileExt);
        const bucketName = fileType === 'image' ? 'pub_images' : 'pub_documents';
        
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;
        
        let uploadProgress = 0;
        const progressHandler = (progress: number) => {
          uploadProgress = progress;
          setUploadProgress(prev => 
            prev.map((item, idx) => 
              idx === i ? { ...item, progress } : item
            )
          );
        };
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        const progressInterval = setInterval(() => {
          if (uploadProgress < 90) {
            progressHandler(uploadProgress + 10);
          } else {
            clearInterval(progressInterval);
          }
        }, 300);
        
        if (error) {
          clearInterval(progressInterval);
          throw error;
        }
        
        clearInterval(progressInterval);
        progressHandler(100);
        
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            name: file.name,
            file_path: urlData.publicUrl,
            type: fileType,
            size: file.size,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            project_id: projectId,
            position: uploadedFiles.length + i,
          });
          
        if (dbError) throw dbError;
        
        setUploadProgress(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, status: 'success', progress: 100 } : item
          )
        );
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        
        setUploadProgress(prev => 
          prev.map((item, idx) => 
            idx === i ? { 
              ...item, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } : item
          )
        );
        
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive"
        });
      }
    }
    
    if (projectId) {
      await fetchUploadedFiles(projectId);
    }
    
    setSelectedFiles([]);
    setIsUploading(false);
    
    const successCount = uploadProgress.filter(item => item.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}.`,
      });
    }
  };
  
  const getFileType = (extension: string): FileType => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const textExtensions = ['txt', 'doc', 'docx', 'pdf', 'md'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (textExtensions.includes(extension)) return 'text';
    return 'other';
  };
  
  const getOverallProgress = (): number => {
    if (uploadProgress.length === 0) return 0;
    
    const totalProgress = uploadProgress.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / uploadProgress.length);
  };
  
  const handleBack = async () => {
    if (projectId) {
      console.log('Step2Files - Updating workflow state to 1 (back to start)');
      
      try {
        const response = await fetch(`${window.location.origin}/api/workflow-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.getSession()}`
          },
          body: JSON.stringify({
            operation: 'update',
            projectId,
            workflowState: 1
          })
        });
        
        const result = await response.json();
        if (result.error) {
          console.error('Error updating workflow state via edge function:', result.error);
          
          const { error } = await supabase.rpc('update_workflow_state', {
            p_project_id: projectId,
            p_workflow_state: 1
          });
          
          if (error) {
            console.error('Error updating workflow state via RPC:', error);
          } else {
            console.log('Successfully updated workflow state to 1 (start step) using RPC');
          }
        } else {
          console.log('Successfully updated workflow state to 1 (start step) using edge function');
        }
      } catch (error) {
        console.error('Error updating workflow state:', error);
      }
    }
    
    navigate('/dashboard/report-wizard/start', {
      state: { projectId },
      replace: true
    });
  };
  
  const handleNext = async () => {
    if (projectId) {
      console.log('Step2Files - Updating workflow state to 3 (process step)');
      
      try {
        const response = await fetch(`${window.location.origin}/api/workflow-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.getSession()}`
          },
          body: JSON.stringify({
            operation: 'update',
            projectId,
            workflowState: 3
          })
        });
        
        const result = await response.json();
        if (result.error) {
          console.error('Error updating workflow state via edge function:', result.error);
          
          const { error } = await supabase.rpc('update_workflow_state', {
            p_project_id: projectId,
            p_workflow_state: 3
          });
          
          if (error) {
            console.error('Error updating workflow state via RPC:', error);
          } else {
            console.log('Successfully updated workflow state to 3 (process step) using RPC');
          }
        } else {
          console.log('Successfully updated workflow state to 3 (process step) using edge function');
        }
      } catch (error) {
        console.error('Error updating workflow state:', error);
      }
    }
    
    navigate('/dashboard/report-wizard/process', {
      state: { projectId },
      replace: true
    });
  };
  
  const handleClearSelected = () => {
    setSelectedFiles([]);
  };
  
  if (loading && !initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading project data...</p>
      </div>
    );
  }
  
  if (!projectId && initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-destructive mb-4">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-xl font-medium mb-2">No Active Project Found</h3>
        <p className="text-muted-foreground mb-4">Please start a new report or select an existing one.</p>
        <Button onClick={() => navigate('/dashboard/report-wizard/start', { replace: true })}>
          Go to Start
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <InstructionsPanel stepNumber={2} />
      
      <div className="max-w-4xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <FileUploadArea 
              onFilesSelected={handleFilesSelected}
              files={selectedFiles}
            />
            
            {selectedFiles.length > 0 && !isUploading && (
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClearSelected}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Selection
                </Button>
                <Button onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </div>
            )}
            
            {isUploading && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Uploading Files...</h4>
                  <span className="text-sm text-muted-foreground">{getOverallProgress()}%</span>
                </div>
                
                <Progress value={getOverallProgress()} className="h-2" />
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {uploadProgress.map((item, index) => (
                    <div key={index} className="flex items-center p-2 bg-muted rounded">
                      <div className="flex-1 mr-2 truncate">{item.file.name}</div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs whitespace-nowrap">
                          {item.status === 'pending' && 'Pending...'}
                          {item.status === 'uploading' && `${item.progress}%`}
                          {item.status === 'success' && 'Complete'}
                          {item.status === 'error' && 'Failed'}
                        </span>
                        
                        {item.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                        {item.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
                        {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="max-w-4xl mx-auto mb-8">
        <h3 className="text-xl font-medium mb-4">Uploaded Files</h3>
        <UploadedFilesTable files={uploadedFiles} loading={loading} />
      </div>
      
      <div className="flex justify-between max-w-4xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={isUploading || (uploadedFiles.length === 0)}
        >
          Next: Process Files
        </Button>
      </div>
    </div>
  );
};

export default Step2Files;
