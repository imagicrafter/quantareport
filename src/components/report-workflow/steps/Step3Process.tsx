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
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { fetchCurrentWorkflow, updateWorkflowState } = useWorkflowNavigation();
  const hasRefreshedRef = useRef(false);
  const completionHandledRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
        setProcessingStatus('error');
        setMessage('Failed to load workflow data. Please try again.');
      }
    };
    
    getWorkflowData();
  }, [fetchCurrentWorkflow, navigate, updateWorkflowState]);

  useEffect(() => {
    if (projectId && !analysisStarted) {
      checkUnprocessedFiles();
      fetchFileCounts();
    }
  }, [projectId, checkUnprocessedFiles, analysisStarted]);

  useEffect(() => {
    if (!projectId || analysisStarted) return;
    
    const startProcessing = async () => {
      try {
        setAnalysisStarted(true);
        setProcessingStatus('generating');
        setMessage('Checking files for analysis...');
        setProgress(5);
        
        // Check if files need processing
        await checkUnprocessedFiles();
        
        if (hasUnprocessedFiles && unprocessedFileCount > 0) {
          console.log(`Found ${unprocessedFileCount} unprocessed files, starting analysis...`);
          setMessage(`Analyzing ${unprocessedFileCount} files...`);
          setProgress(10);
          
          // Start file analysis with proper callback setup
          const jobId = await analyzeFiles((jobId: string) => {
            console.log('Setting up real-time subscription for job:', jobId);
            setCurrentJobId(jobId);
            setupRealtimeSubscription(jobId);
          });
          
          if (!jobId) {
            throw new Error('Failed to start file analysis');
          }
        } else {
          console.log('No unprocessed files found, completing processing immediately');
          await completeProcessing();
        }
      } catch (error) {
        console.error('Error starting processing:', error);
        setProcessingStatus('error');
        setMessage('Failed to start file analysis. Please try again.');
        setProgress(0);
      }
    };
    
    startProcessing();
  }, [projectId, hasUnprocessedFiles, unprocessedFileCount, analyzeFiles, analysisStarted]);

  const setupRealtimeSubscription = (jobId: string) => {
    if (!jobId) {
      console.error('Cannot setup subscription without job ID');
      return;
    }
    
    // Clean up existing subscription
    cleanupSubscriptions();
    
    const channelName = `file-analysis-progress-${jobId}-${Date.now()}`;
    console.log(`Setting up realtime subscription on channel: ${channelName} for job: ${jobId}`);
    
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
          console.log('Received progress update for file analysis:', payload);
          const latestProgress = payload.new;
          
          if (latestProgress && typeof latestProgress === 'object') {
            const progressData = latestProgress as Record<string, any>;
            
            if (progressData.message && typeof progressData.message === 'string') {
              setMessage(progressData.message);
            }
            if (typeof progressData.progress === 'number') {
              setProgress(progressData.progress);
            }
            if (progressData.status && typeof progressData.status === 'string') {
              setProcessingStatus(progressData.status as 'idle' | 'generating' | 'completed' | 'error');
            }

            // Handle completion with proper checks
            if ((progressData.status === 'completed' || progressData.progress === 100) && !completionHandledRef.current) {
              console.log('Analysis completed successfully');
              handleAnalysisCompletion(true);
            } else if (progressData.status === 'error' && !completionHandledRef.current) {
              console.log('Analysis failed with error');
              handleAnalysisCompletion(false);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`File analysis subscription status for ${channelName}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to progress updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error, retrying...');
          // Retry subscription after a delay
          setTimeout(() => {
            if (!completionHandledRef.current) {
              setupRealtimeSubscription(jobId);
            }
          }, 2000);
        }
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
    if (completionHandledRef.current) {
      console.log('Completion already handled, skipping');
      return;
    }
    
    completionHandledRef.current = true;
    console.log('Analysis completion handler executed, success:', isSuccess);
    
    // Clean up subscriptions
    cleanupSubscriptions();
    
    if (isSuccess) {
      setMessage('Analysis completed successfully');
      setProgress(100);
      setProcessingStatus('completed');
      await completeProcessing();
    } else {
      setProcessingStatus('error');
      setMessage('Analysis failed. Please try again.');
      setProgress(0);
    }
  };

  const completeProcessing = async () => {
    try {
      console.log('Completing processing and fetching final counts...');
      await fetchFileCounts();
      setProcessingComplete(true);
      setProcessingStatus('completed');
      setProgress(100);
      setMessage('All files have been successfully processed');
      
      // Auto-proceed to next step after a delay, with safety check
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      navigationTimeoutRef.current = setTimeout(() => {
        console.log('Auto-navigating to next step...');
        handleNext();
      }, 3000);
      
    } catch (error) {
      console.error('Error completing processing:', error);
      setProcessingStatus('error');
      setMessage('Failed to complete processing. Please try again.');
    }
  };

  const fetchFileCounts = async () => {
    if (!projectId) return;
    
    try {
      console.log('Fetching file counts for project:', projectId);
      
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
      
      const { data: notes, error: notesError } = await supabase
        .from('v_project_notes_excluding_template')
        .select('id')
        .eq('project_id', projectId);
        
      if (!notesError && notes) {
        setNotesCount(notes.length);
      }
      
      console.log(`File counts - Text: ${textDocs?.length || 0}, Images: ${images?.length || 0}, Notes: ${notes?.length || 0}`);
    } catch (error) {
      console.error('Error fetching file counts:', error);
    }
  };
  
  const handleBack = () => {
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    cleanupSubscriptions();
    
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
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    cleanupSubscriptions();
    
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
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    cleanupSubscriptions();
    
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

  // Clean up subscriptions and timeouts on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
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
            
            {processingStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md w-full mt-4">
                <h4 className="font-medium text-red-800 mb-2">Processing Error</h4>
                <p className="text-red-700 text-sm mb-3">{message}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setAnalysisStarted(false);
                    completionHandledRef.current = false;
                    setProcessingStatus('idle');
                    setProgress(0);
                    setMessage('Starting analysis...');
                  }}
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
