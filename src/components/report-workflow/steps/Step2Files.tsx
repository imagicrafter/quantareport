import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
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
  const initialRenderRef = useRef(true);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProjectId, setHasProjectId] = useState(false);
  
  // Get project ID from URL state or localStorage
  const projectId = location.state?.projectId || localStorage.getItem('currentProjectId');
  
  console.log('Step2Files - Project ID from state or localStorage:', projectId);
  console.log('Step2Files - Location state:', location.state);
  console.log('Step2Files - Initial render:', initialRenderRef.current);
  
  // Special effect that only runs once on mount to ensure projectId exists
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      
      if (!projectId) {
        console.log('Step2Files - No project ID found on initial render, navigating back to step 1');
        toast({
          title: "Error",
          description: "No project found. Please start a new report.",
          variant: "destructive"
        });
        navigate('/dashboard/report-wizard/start');
      } else {
        console.log('Step2Files - Project ID found on initial render:', projectId);
        setHasProjectId(true);
        fetchUploadedFiles();
      }
    }
  }, []);
  
  // Regular effect to fetch files whenever projectId changes
  useEffect(() => {
    if (!initialRenderRef.current && projectId) {
      console.log('Step2Files - Project ID changed, fetching files for:', projectId);
      setHasProjectId(true);
      fetchUploadedFiles();
    }
  }, [projectId]);
  
  const fetchUploadedFiles = async () => {
    if (!projectId) {
      console.log('Step2Files - fetchUploadedFiles called but no projectId available');
      return;
    }
    
    setLoading(true);
    console.log('Step2Files - Fetching files for project:', projectId);
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Step2Files - Error fetching files:', error);
        throw error;
      }
      
      console.log('Step2Files - Fetched files for project:', projectId, data);
      
      // Convert the string type to FileType
      const typedFiles = data?.map(file => ({
        ...file,
        type: file.type as FileType // Cast the string type to FileType
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
      // Filter out any duplicate files by name
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
    
    // Initialize progress tracking for each file
    const initialProgress: FileUploadProgress[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(initialProgress);
    
    // Upload each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        // Update status to uploading
        setUploadProgress(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, status: 'uploading' } : item
          )
        );
        
        // Determine file type and bucket
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const fileType = getFileType(fileExt);
        const bucketName = fileType === 'image' ? 'pub_images' : 'pub_documents';
        
        // Generate a unique filename
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;
        
        // Create a progress handler
        let uploadProgress = 0;
        const progressHandler = (progress: number) => {
          uploadProgress = progress;
          setUploadProgress(prev => 
            prev.map((item, idx) => 
              idx === i ? { ...item, progress } : item
            )
          );
        };
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        // Regularly update progress since onUploadProgress is not supported
        // This is a workaround to simulate progress
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
        
        // Clear the interval and set progress to 100%
        clearInterval(progressInterval);
        progressHandler(100);
        
        // Get public URL
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
          
        // Save file record to database
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
        
        // Update progress status
        setUploadProgress(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, status: 'success', progress: 100 } : item
          )
        );
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        
        // Update progress with error
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
    
    // Refresh the files list
    await fetchUploadedFiles();
    
    // Reset the selected files after upload is complete
    setSelectedFiles([]);
    setIsUploading(false);
    
    // Show success message if at least one file was uploaded successfully
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
  
  const handleBack = () => {
    console.log('Step2Files - Navigating back to start with projectId:', projectId);
    navigate('/dashboard/report-wizard/start', {
      state: { projectId }
    });
  };
  
  const handleNext = () => {
    console.log('Step2Files - Navigating to process step with projectId:', projectId);
    navigate('/dashboard/report-wizard/process', {
      state: { projectId }
    });
  };
  
  const handleClearSelected = () => {
    setSelectedFiles([]);
  };
  
  // If we don't have a project ID, return null or redirect
  if (!hasProjectId) {
    console.log('Step2Files - No project ID, not rendering content');
    return null;
  }
  
  console.log('Step2Files - Rendering content with projectId:', projectId);
  
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
                  Clear Selection
                </Button>
                <Button onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </div>
            )}
            
            {/* Upload Progress */}
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
      
      {/* Uploaded Files Table */}
      <div className="max-w-4xl mx-auto mb-8">
        <h3 className="text-xl font-medium mb-4">Uploaded Files</h3>
        <UploadedFilesTable files={uploadedFiles} loading={loading} />
      </div>
      
      {/* Navigation Buttons */}
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
