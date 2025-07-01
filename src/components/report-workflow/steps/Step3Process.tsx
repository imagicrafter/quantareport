
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import InstructionsPanel from '../start-report/InstructionsPanel';
import StepBanner from '../StepBanner';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkflowNavigation } from '@/hooks/report-workflow/useWorkflowNavigation';
import { useImageAnalysis } from '@/components/dashboard/files/hooks/useImageAnalysis';
import { supabase } from '@/integrations/supabase/client';
import FileAnalysisProgress from '../FileAnalysisProgress';

const Step3Process = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [textDocumentCount, setTextDocumentCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [fileCheckComplete, setFileCheckComplete] = useState(false);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const completionHandledRef = useRef(false);
  
  const {
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles
  } = useImageAnalysis(projectId, projectName);

  // Initialize workflow and project data
  useEffect(() => {
    const initializeWorkflow = async () => {
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
        console.error('Error initializing workflow:', error);
        setProcessingStatus('error');
        setMessage('Failed to load workflow data. Please try again.');
      }
    };
    
    initializeWorkflow();
  }, [fetchCurrentWorkflow, navigate, updateWorkflowState]);

  // Check for unprocessed files when project is loaded
  useEffect(() => {
    const performFileCheck = async () => {
      if (!projectId || fileCheckComplete) return;
      
      try {
        setMessage('Checking files for processing...');
        setProgress(5);
        
        await checkUnprocessedFiles();
        await fetchFileCounts();
        
        setFileCheckComplete(true);
        setMessage('File check complete. Ready to process.');
        setProgress(10);
        
        console.log(`File check results - Unprocessed: ${unprocessedFileCount}, Has files: ${hasUnprocessedFiles}`);
      } catch (error) {
        console.error('Error during file check:', error);
        setProcessingStatus('error');
        setMessage('Error checking files. Please try again.');
      }
    };
    
    performFileCheck();
  }, [projectId, checkUnprocessedFiles, hasUnprocessedFiles, unprocessedFileCount, fileCheckComplete]);

  // Start analysis only after file check is complete and user hasn't started analysis yet
  useEffect(() => {
    const startAnalysis = async () => {
      if (!fileCheckComplete || analysisStarted || !projectId) return;
      
      try {
        setAnalysisStarted(true);
        setProcessingStatus('generating');
        
        if (hasUnprocessedFiles && unprocessedFileCount > 0) {
          console.log(`Starting analysis of ${unprocessedFileCount} unprocessed files`);
          setMessage(`Analyzing ${unprocessedFileCount} files...`);
          setProgress(15);
          
          const jobId = await analyzeFiles((jobId: string) => {
            console.log('Setting up real-time subscription for job:', jobId);
            setCurrentJobId(jobId);
            setupRealtimeSubscription(jobId);
          });
          
          if (!jobId) {
            throw new Error('Failed to start file analysis');
          }
        } else {
          console.log('No unprocessed files found, marking as complete');
          handleNoFilesToProcess();
        }
      } catch (error) {
        console.error('Error starting analysis:', error);
        setProcessingStatus('error');
        setMessage('Failed to start file analysis. Please check the files and try again.');
        setAnalysisStarted(false);
      }
    };
    
    startAnalysis();
  }, [fileCheckComplete, analysisStarted, projectId, hasUnprocessedFiles, unprocessedFileCount, analyzeFiles]);

  const setupRealtimeSubscription = (jobId: string) => {
    if (!jobId) {
      console.error('Cannot setup subscription without job ID');
      setProcessingStatus('error');
      setMessage('Failed to setup progress tracking');
      return;
    }
    
    // Clean up existing subscription
    cleanupSubscriptions();
    
    const channelName = `file-analysis-progress-${jobId}`;
    console.log(`Setting up subscription for job: ${jobId}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_progress',
          filter: `job=eq.${jobId}`
        },
        (payload) => {
          console.log('Progress update received:', payload);
          handleProgressUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status: ${status}`);
        if (status === 'CHANNEL_ERROR') {
          console.error('Subscription failed, will rely on polling fallback');
          setMessage('Progress tracking may be delayed');
        }
      });
      
    setSubscription(channel);
  };

  const handleProgressUpdate = (payload: any) => {
    const progressData = payload.new;
    
    if (!progressData || completionHandledRef.current) return;
    
    if (progressData.message) {
      setMessage(progressData.message);
    }
    if (typeof progressData.progress === 'number') {
      setProgress(progressData.progress);
    }
    if (progressData.status) {
      setProcessingStatus(progressData.status);
    }

    // Handle completion
    if (progressData.status === 'completed' || progressData.progress === 100) {
      handleAnalysisCompletion(true);
    } else if (progressData.status === 'error') {
      handleAnalysisCompletion(false);
    }
  };

  const handleAnalysisCompletion = (isSuccess: boolean) => {
    if (completionHandledRef.current) return;
    
    completionHandledRef.current = true;
    console.log('Analysis completion:', isSuccess ? 'success' : 'failure');
    
    cleanupSubscriptions();
    
    if (isSuccess) {
      setMessage('Analysis completed successfully!');
      setProgress(100);
      setProcessingStatus('completed');
      setProcessingComplete(true);
      fetchFileCounts(); // Update final counts
    } else {
      setProcessingStatus('error');
      setMessage('Analysis failed. Please check your files and try again.');
      setProgress(0);
    }
  };

  const handleNoFilesToProcess = () => {
    console.log('No files to process, marking as complete');
    setProcessingStatus('completed');
    setProgress(100);
    setMessage('No files require processing. All files are up to date.');
    setProcessingComplete(true);
  };

  const cleanupSubscriptions = () => {
    if (subscription) {
      console.log('Cleaning up subscription');
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  };

  const fetchFileCounts = async () => {
    if (!projectId) return;
    
    try {
      const [textResult, imageResult, notesResult] = await Promise.all([
        supabase.from('files').select('id').eq('project_id', projectId).neq('type', 'image'),
        supabase.from('files').select('id').eq('project_id', projectId).eq('type', 'image'),
        supabase.from('v_project_notes_excluding_template').select('id').eq('project_id', projectId)
      ]);
      
      setTextDocumentCount(textResult.data?.length || 0);
      setImageCount(imageResult.data?.length || 0);
      setNotesCount(notesResult.data?.length || 0);
    } catch (error) {
      console.error('Error fetching file counts:', error);
    }
  };

  const handleRetry = () => {
    console.log('Retrying analysis');
    setAnalysisStarted(false);
    setFileCheckComplete(false);
    completionHandledRef.current = false;
    setProcessingStatus('idle');
    setProgress(0);
    setMessage('Initializing...');
    setProcessingComplete(false);
    cleanupSubscriptions();
  };
  
  const handleBack = () => {
    cleanupSubscriptions();
    
    if (projectId) {
      updateWorkflowState(projectId, 2)
        .then(() => navigate('/dashboard/report-wizard/files'))
        .catch(error => console.error('Error updating workflow state:', error));
    } else {
      navigate('/dashboard/report-wizard/files');
    }
  };
  
  const handleNext = () => {
    cleanupSubscriptions();
    
    if (projectId) {
      updateWorkflowState(projectId, 4)
        .then(() => navigate('/dashboard/report-wizard/notes'))
        .catch(error => console.error('Error updating workflow state:', error));
    } else {
      navigate('/dashboard/report-wizard/notes');
    }
  };
  
  const handleBannerClick = () => {
    cleanupSubscriptions();
    
    if (projectId) {
      updateWorkflowState(projectId, 2)
        .then(() => navigate('/dashboard/report-wizard/files'))
        .catch(error => console.error('Error updating workflow state:', error));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, []);
  
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
            <FileAnalysisProgress
              progress={progress}
              message={message}
              status={processingStatus}
              fileCount={unprocessedFileCount}
            />
            
            {processingStatus === 'completed' && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md w-full mt-4">
                <h4 className="font-medium text-green-800 mb-2">Processing Complete!</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  <li>Processed {textDocumentCount} document{textDocumentCount !== 1 ? 's' : ''}</li>
                  <li>Analyzed {imageCount} image{imageCount !== 1 ? 's' : ''}</li>
                  <li>Generated {notesCount} note{notesCount !== 1 ? 's' : ''}</li>
                </ul>
                <p className="text-sm text-green-600 mt-2 font-medium">
                  Ready to proceed to the next step.
                </p>
              </div>
            )}
            
            {processingStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md w-full mt-4">
                <h4 className="font-medium text-red-800 mb-2">Processing Error</h4>
                <p className="text-red-700 text-sm mb-3">{message}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetry}
                >
                  Retry Analysis
                </Button>
              </div>
            )}
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
    </div>
  );
};

export default Step3Process;
