import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ProjectFile } from '@/components/dashboard/files/FileItem';
import StepBanner from '../StepBanner';
import ImageAnnotationModal from '../file-upload/ImageAnnotationModal';
import { FilesProvider, useFiles } from '../file-upload/context/FilesContext';
import FileUploadTabs from '../file-upload/components/FileUploadTabs';
import FilesPreview from '../file-upload/components/FilesPreview';
import { removeImageExtension } from '@/utils/fileUtils';

const Step2FilesContent = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { files, isLoading, fetchFiles, handleFilesUploaded, handleFileDeleted } = useFiles();

  useEffect(() => {
    const setupStep = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('No authenticated user found');
        }

        const { data: workflowData } = await supabase
          .from('project_workflow')
          .select('project_id')
          .eq('user_id', userData.user.id)
          .eq('workflow_state', 2)
          .order('last_edited_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (workflowData?.project_id) {
          setProjectId(workflowData.project_id);
          await fetchFiles(workflowData.project_id);

          const { data: projectData } = await supabase
            .from('projects')
            .select('name')
            .eq('id', workflowData.project_id)
            .single();

          if (projectData) {
            setProjectName(projectData.name);
          }
        } else {
          toast({
            title: "Missing Project",
            description: "Could not find an active project. Please start a new report.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error setting up step:', error);
      }
    };

    setupStep();
  }, [toast, fetchFiles]);

  const handleSaveAnnotation = async (annotatedImageBlob: Blob) => {
    if (!projectId || !selectedImage) {
      toast({
        title: "Error",
        description: "Missing project or image information.",
        variant: "destructive"
      });
      return;
    }

    try {
      const originalName = selectedImage.name;
      const fileExtension = selectedImage.name.split('.').pop() || 'png';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newFileName = `${Date.now()}-${originalName}.${fileExtension}`;
      const annotatedFile = new File([annotatedImageBlob], newFileName, { type: 'image/png' });
      const filePath = `${projectId}/${newFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pub_images')
        .upload(filePath, annotatedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from('pub_images')
        .getPublicUrl(filePath);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user found');

      const displayName = `${removeImageExtension(originalName)} (Annotated)`;

      await supabase
        .from('files')
        .insert({
          name: displayName,
          file_path: urlData.publicUrl,
          type: 'image',
          project_id: projectId,
          user_id: userData.user.id,
          size: annotatedFile.size,
          metadata: { 
            annotated: true,
            original_file_id: selectedImage.id 
          }
        });

      toast({
        title: "Success",
        description: "Annotated image saved successfully!",
      });
      
      fetchFiles(projectId);
    } catch (error) {
      console.error('Error saving annotated image:', error);
      toast({
        title: "Error",
        description: "Failed to save annotated image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveText = async (text: string) => {
    if (!projectId || !text.trim()) {
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
      const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const fileName = `${projectName}_${datePart}_${randomNumber}.txt`;
      const filePath = `${projectId}/${fileName}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const fileObject = new File([blob], fileName, { type: 'text/plain' });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pub_documents')
        .upload(filePath, fileObject);

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from('pub_documents')
        .getPublicUrl(filePath);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user found');

      await supabase
        .from('files')
        .insert({
          name: fileName,
          file_path: urlData.publicUrl,
          type: 'text',
          project_id: projectId,
          user_id: userData.user.id,
          size: fileObject.size,
          metadata: { content: text }
        });

      toast({
        title: "Success",
        description: "Text file saved successfully!",
      });

      fetchFiles(projectId);
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
      if (!userData.user) throw new Error('No authenticated user found');

      await supabase
        .from('project_workflow')
        .update({ 
          workflow_state: 3,
          last_edited_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('user_id', userData.user.id);

      navigate('/dashboard/report-wizard/process');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
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

      <FileUploadTabs
        projectId={projectId}
        onTextSave={handleSaveText}
        onFilesUploaded={handleFilesUploaded}
      />

      <div className="mt-8">
        <FilesPreview
          files={files}
          onFileClick={setSelectedImage}
          onFileDelete={handleFileDeleted}
        />
      </div>
      
      <ImageAnnotationModal
        imageUrl={selectedImage?.file_path || ''}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        onSave={handleSaveAnnotation}
      />
      
      <div className="flex justify-end max-w-4xl mx-auto mt-8">
        <Button
          onClick={handleNextStep}
          disabled={files.length === 0}
          className="next-step-button"
        >
          Next: Process Files
        </Button>
      </div>
    </div>
  );
};

const Step2Files = () => {
  return (
    <FilesProvider>
      <Step2FilesContent />
    </FilesProvider>
  );
};

export default Step2Files;
