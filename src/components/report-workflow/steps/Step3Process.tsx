
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
  const [message, setMessage] = useState('Starting analysis...');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [textDocumentCount, setTextDocumentCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const hasRefreshedRef = useRef(false);
  
  const {
    hasUnprocessedFiles,
    unprocessedFileCount,
    checkUnprocessedFiles,
    analyzeFiles
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
      setProcessingStatus('generating');
      setMessage('Initializing analysis...');
      
      if (hasUnprocessedFiles) {
        console.log('Unprocessed files found, starting analysis...');
        await analyzeFiles();
      } else {
        console.log('No unprocessed files found, completing processing');
        await completeProcessing();
      }
    };
    
    startProcessing();
  }, [projectId, hasUnprocessedFiles, analyzeFiles]);

  const setupRealtimeSubscription = (jobId: string) => {
    if (!jobId) return;
    
    const channelName = `file-analysis-progress-${jobId}-${Date.now()}`;
    console.log(`Setting up realtime subscription on channel: ${channelName} for job: ${jobId}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_progress',
          filter: `job=eq.${jobId}`
        },
        (payload) => {
          console.log('Received progress update for file analysis:', payload);
          const latestProgress = payload.new;
          setMessage(latestProgress.message || 'Processing files...');
          setProgress(latestProgress.progress || 0);
          setProcessingStatus(latestProgress.status as any);

          if (latestProgress.status === 'completed' || latestProgress.progress === 100) {
            handleAnalysisCompletion(true);
          } else if (latestProgress.status === 'error') {
            handleAnalysisCompletion(false);
          }
        }
      )
      .subscribe((status) => {
        console.log(`File analysis subscription status for ${channelName}:`, status);
      });
      
    setSubscription(channel);
  };

  const cleanupSubscriptions = () => {
    if (subscription) {
      console.log('Removing file analysis progress subscription');
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  };

  const handleAnalysisCompletion = async (isSuccess: boolean) => {
    if (hasRefreshedRef.current) return;
    
    hasRefreshedRef.current = true;
    console.log('Analysis completion handler executed, success:', isSuccess);
    
    cleanupSubscriptions();
    
    if (isSuccess) {
      await completeProcessing();
    } else {
      setProcessingStatus('error');
      setMessage('Analysis failed. Please try again.');
    }
  };

  const completeProcessing = async () => {
    await fetchFileCounts();
    setProcessingComplete(true);
    setProcessingStatus('completed');
    setProgress(100);
    setMessage('All files have been successfully processed');
    
    // Auto-proceed to next step after a brief delay
    setTimeout(() => {
      handleNext();
    }, 2000);
  };

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
        await completeProcessing();
      }
    } catch (error) {
      console.error('Error in fetchAnalyzedFiles:', error);
    }
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

  // Clean up subscriptions on unmount
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
              <div className="bg-muted p-4 rounded-md w-full mt-4">
                <h4 className="font-medium mb-2">Processing Results:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Identified {notesCount} notes from {textDocumentCount} document{textDocumentCount !== 1 ? 's' : ''}</li>
                  <li>Analyzed {imageCount} images with AI vision</li>
                  <li>Generated key insights from content</li>
                </ul>
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
