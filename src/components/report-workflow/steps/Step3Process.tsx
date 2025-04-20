import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import InstructionsPanel from '../start-report/InstructionsPanel';
import StepBanner from '../StepBanner';
import { Card, CardContent } from '@/components/ui/card';
import { FileSearch, CheckCircle, AlertCircle } from 'lucide-react';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { useImageAnalysis } from '@/components/dashboard/files/hooks/useImageAnalysis';
import { supabase } from '@/integrations/supabase/client';
import FileAnalysisProgressModal from '@/components/dashboard/files/FileAnalysisProgressModal';

const Step3Process = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [textDocumentCount, setTextDocumentCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  
  const {
    isAnalyzing,
    analysisJobId,
    hasUnprocessedFiles,
    unprocessedFileCount,
    isProgressModalOpen,
    checkUnprocessedFiles,
    analyzeFiles,
    closeProgressModal,
    handleAnalysisComplete
  } = useImageAnalysis(projectId, projectName);

  useEffect(() => {
    const getWorkflowData = async () => {
      try {
        const { workflowState, projectId: currentProjectId } = await fetchCurrentWorkflow();
        
        if (!currentProjectId) {
          console.log('No project ID found, navigating to step 1');
          navigate('/dashboard/report-wizard/start');
          return;
        }
        
        setProjectId(currentProjectId);
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('name')
          .eq('id', currentProjectId)
          .single();
          
        if (!projectError && projectData) {
          setProjectName(projectData.name);
        }
        
        if (workflowState === 2) {
          await updateWorkflowState(currentProjectId, 3);
          console.log('Updated workflow state to 3');
        } else if (workflowState !== 3) {
          const steps = ['start', 'files', 'process', 'notes', 'generate', 'review'];
          navigate(`/dashboard/report-wizard/${steps[workflowState - 1] || 'start'}`);
        }
      } catch (error) {
        console.error('Error fetching workflow data:', error);
      }
    };
    
    getWorkflowData();
  }, [fetchCurrentWorkflow, navigate, updateWorkflowState]);

  useEffect(() => {
    if (projectId) {
      checkUnprocessedFiles();
      fetchAnalyzedFiles();
    }
  }, [projectId, checkUnprocessedFiles]);

  useEffect(() => {
    if (!projectId) return;
    
    const startProcessing = async () => {
      setProcessingStatus('processing');
      
      if (hasUnprocessedFiles) {
        console.log('Unprocessed files found, starting analysis...');
        await analyzeFiles();
      } else {
        console.log('No unprocessed files found, skipping analysis');
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setProcessingComplete(true);
              setProcessingStatus('complete');
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      }
    };
    
    startProcessing();
  }, [projectId, hasUnprocessedFiles, analyzeFiles]);

  const fetchFileCounts = async () => {
    if (!projectId) return;
    
    try {
      const { data: textDocs, error: textError } = await supabase
        .from('files')
        .select('id')
        .eq('project_id', projectId)
        .neq('type', 'image');
        
      if (!textError) {
        setTextDocumentCount(textDocs?.length || 0);
      }
      
      const { data: images, error: imageError } = await supabase
        .from('files')
        .select('id')
        .eq('project_id', projectId)
        .eq('type', 'image');
        
      if (!imageError) {
        setImageCount(images?.length || 0);
      }
      
      const { data, error: notesError } = await supabase
        .from('v_project_notes_excluding_template')
        .select('id')
        .eq('project_id', projectId);
        
      if (!notesError && data) {
        setNotesCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching file counts:', error);
    }
  };

  const fetchAnalyzedFiles = async () => {
    if (!projectId) return;
    
    try {
      const { data: unprocessedFiles, error: unprocessedError } = await supabase
        .from('v_files_not_processed')
        .select('id')
        .eq('project_id', projectId);
        
      if (unprocessedError) {
        console.error('Error fetching unprocessed files:', unprocessedError);
        return;
      }
      
      if (!unprocessedFiles || unprocessedFiles.length === 0) {
        await fetchFileCounts();
        setProcessingComplete(true);
        setProcessingStatus('complete');
        setProgress(100);
      }
      
    } catch (error) {
      console.error('Error in fetchAnalyzedFiles:', error);
    }
  };

  const onAnalysisComplete = () => {
    setProcessingComplete(true);
    setProcessingStatus('complete');
    setProgress(100);
    fetchFileCounts();
    handleAnalysisComplete();
  };
  
  const handleBack = () => {
    if (projectId) {
      updateWorkflowState(projectId, 2)
        .then(() => {
          navigate('/dashboard/report-wizard/files');
        })
        .catch(error => {
          console.error('Error updating workflow state:', error);
        });
    } else {
      navigate('/dashboard/report-wizard/files');
    }
  };
  
  const handleNext = () => {
    if (projectId) {
      updateWorkflowState(projectId, 4)
        .then(() => {
          navigate('/dashboard/report-wizard/notes');
        })
        .catch(error => {
          console.error('Error updating workflow state:', error);
        });
    } else {
      navigate('/dashboard/report-wizard/notes');
    }
  };
  
  const handleBannerClick = () => {
    if (projectId) {
      updateWorkflowState(projectId, 2)
        .then(() => {
          navigate('/dashboard/report-wizard/files');
        })
        .catch(error => {
          console.error('Error updating workflow state:', error);
        });
    }
  };
  
  return (
    <div className="container mx-auto px-4 pt-8 pb-12">
      <StepBanner 
        step={3}
        isActive={true}
        onClick={handleBannerClick}
      />
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Process Files</h2>
        <p className="text-muted-foreground">Your files are being processed and analyzed.</p>
      </div>
      
      <InstructionsPanel stepNumber={3} />
      
      <div className="max-w-3xl mx-auto mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center py-4">
              {processingStatus === 'processing' && (
                <FileSearch className="h-16 w-16 text-primary mb-4 animate-pulse" />
              )}
              
              {processingStatus === 'complete' && (
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              )}
              
              {processingStatus === 'error' && (
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              )}
              
              <h3 className="text-lg font-medium mb-2">
                {processingStatus === 'processing' && 'Processing Files'}
                {processingStatus === 'complete' && 'Processing Complete'}
                {processingStatus === 'error' && 'Processing Error'}
              </h3>
              
              <div className="w-full max-w-md mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {processingStatus === 'processing' && `Analyzing content... ${progress}%`}
                  {processingStatus === 'complete' && 'All files have been successfully processed'}
                  {processingStatus === 'error' && 'An error occurred during processing'}
                </p>
              </div>
              
              {processingStatus === 'complete' && (
                <div className="bg-muted p-4 rounded-md w-full mt-4">
                  <h4 className="font-medium mb-2">Processing Results:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Identified {notesCount} notes from {textDocumentCount} document{textDocumentCount !== 1 ? 's' : ''}</li>
                    <li>Analyzed {imageCount} images with AI vision</li>
                    <li>Generated key insights from content</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between max-w-3xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!processingComplete}
        >
          Next: Edit Notes
        </Button>
      </div>

      <FileAnalysisProgressModal
        isOpen={isProgressModalOpen}
        onClose={closeProgressModal}
        jobId={analysisJobId}
        projectId={projectId}
        fileCount={unprocessedFileCount}
        onAnalysisComplete={onAnalysisComplete}
      />
    </div>
  );
};

export default Step3Process;
