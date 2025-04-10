
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StepIndicator from '@/components/report-workflow/StepIndicator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FilesSection from '@/components/dashboard/FilesSection';

const UploadAndPrepareFiles = () => {
  const [projectId, setProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setIsLoading(true);

        // Get project_id from URL params or state
        const params = new URLSearchParams(location.search);
        const projectIdFromUrl = params.get('projectId');
        const projectIdFromState = location.state?.projectId;
        
        // Use either source of projectId
        const currentProjectId = projectIdFromUrl || projectIdFromState;
        
        if (!currentProjectId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No project selected. Please start from Step 1.',
          });
          navigate('/dashboard/start-new-report');
          return;
        }

        setProjectId(currentProjectId);
        
        // Fetch project name for display
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('name')
          .eq('id', currentProjectId)
          .single();
          
        if (projectError) {
          throw projectError;
        }
        
        if (projectData) {
          setProjectName(projectData.name);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load project information. Please try again.',
        });
        navigate('/dashboard/start-new-report');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [navigate, location, toast]);

  const handleStepClick = (step: number) => {
    if (step === 1) {
      // Navigate back to step 1 with current project context
      navigate('/dashboard/start-new-report', { 
        state: { 
          projectId,
          returnToStep2: true
        } 
      });
    } else if (step === 2) {
      // Current step - do nothing
    } else {
      // For future steps
      toast({
        description: `Step ${step} will be implemented in a future update.`,
      });
    }
  };

  const handleNextStep = () => {
    // To be implemented when Step 3 is available
    toast({
      description: "Step 3 will be implemented in a future update.",
    });
  };

  const handlePreviousStep = () => {
    navigate('/dashboard/start-new-report', { 
      state: { 
        projectId,
        returnToStep2: true
      } 
    });
  };

  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Upload and Prepare Files
      </h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator 
          currentStep={2}
          totalSteps={6}
          onStepClick={handleStepClick}
        />
      </div>
      
      {/* Instructions Placeholder */}
      <div className="bg-accent/30 p-4 rounded-md mb-6">
        <p className="text-muted-foreground text-center">[Instructions for Step 2 will be added here]</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-quanta-blue"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Project: {projectName}</h2>
          </div>
          
          {/* Files Section - reusing the FilesSection component */}
          <div className="h-[calc(100vh-380px)] border rounded-md bg-white overflow-hidden">
            <FilesSection projectId={projectId} projectName={projectName} />
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
            >
              Previous Step
            </Button>
            <Button
              onClick={handleNextStep}
            >
              Next Step
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadAndPrepareFiles;
